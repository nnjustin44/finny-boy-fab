package com.finnyboyfab.store.persistence;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.util.function.Function;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

/** Single-process, bounded, atomic snapshots. A failed write never publishes memory-only state. */
@Component
public class LocalStore implements AutoCloseable {
    private final ObjectMapper mapper;
    private final Path file;
    private final FileChannel lockChannel;
    private final FileLock lock;
    private final long ttlMillis;
    private final long emptyTtlMillis;
    private final int maxCarts;
    private final int maxCompletions;
    private StoreState state;
    private boolean writeFailed;

    @Autowired
    public LocalStore(ObjectMapper mapper,
            @Value("${store.data-dir:./data}") String directory,
            @Value("${store.cart-ttl-days:30}") int ttlDays,
            @Value("${store.empty-cart-ttl-minutes:60}") int emptyTtlMinutes,
            @Value("${store.max-carts:5000}") int maxCarts,
            @Value("${store.max-completions:10000}") int maxCompletions) {
        this.mapper = mapper;
        if (ttlDays < 1 || emptyTtlMinutes < 1 || maxCarts < 1 || maxCompletions < 1) throw new IllegalArgumentException("Store limits must be positive");
        this.ttlMillis = Math.multiplyExact(ttlDays, 86_400_000L);
        this.emptyTtlMillis = Math.multiplyExact(emptyTtlMinutes, 60_000L);
        this.maxCarts = maxCarts;
        this.maxCompletions = maxCompletions;
        FileChannel channel = null;
        FileLock acquired = null;
        try {
            Path dir = Path.of(directory).toAbsolutePath();
            Files.createDirectories(dir);
            file = dir.resolve("store-state.json");
            channel = FileChannel.open(dir.resolve("store.lock"), StandardOpenOption.CREATE, StandardOpenOption.WRITE);
            acquired = channel.tryLock();
            if (acquired == null) throw new IllegalStateException("STORE_DATA_DIR is already in use; run only one replica");
            state = Files.exists(file) ? mapper.readValue(file.toFile(), StoreState.class) : new StoreState();
            if (state.carts == null || state.completions == null) throw new IllegalStateException("Invalid store snapshot");
            lockChannel = channel;
            lock = acquired;
        } catch (IOException | RuntimeException e) {
            try { if (acquired != null) acquired.release(); if (channel != null) channel.close(); } catch (IOException ignored) { }
            throw new IllegalStateException("Cannot open persistent store; refusing to discard checkout state", e);
        }
    }

    /** Convenience constructor for focused tests and local tools. */
    public LocalStore(ObjectMapper mapper, String directory, int ttlDays, int maxCarts, int maxCompletions) {
        this(mapper, directory, ttlDays, 60, maxCarts, maxCompletions);
    }

    public synchronized <T> T read(Function<StoreState, T> action) { return action.apply(state); }

    public synchronized <T> T change(Function<StoreState, T> action) {
        if (writeFailed) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Store needs recovery after a write failure; contact support");
        StoreState next = state.copy();
        prune(next, System.currentTimeMillis());
        T result = action.apply(next);
        while (next.completions.size() > maxCompletions) next.completions.remove(next.completions.keySet().iterator().next());
        if (next.carts.size() > maxCarts) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Cart capacity reached; please try again later");
        try {
            byte[] bytes = mapper.writeValueAsBytes(next);
            Path temp = file.resolveSibling("store-state.next");
            try (FileChannel output = FileChannel.open(temp, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE)) {
                ByteBuffer buffer = ByteBuffer.wrap(bytes);
                while (buffer.hasRemaining()) output.write(buffer);
                output.force(true);
            }
            Files.move(temp, file, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            // Persist the rename too; the production volume must support atomic rename and fsync.
            try (FileChannel dir = FileChannel.open(file.getParent(), StandardOpenOption.READ)) { dir.force(true); }
            state = next;
            return result;
        } catch (IOException | JacksonException e) {
            writeFailed = true;
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Unable to save cart/payment state; retry safely", e);
        }
    }

    public synchronized boolean healthy() {
        return !writeFailed && lock.isValid() && lockChannel.isOpen();
    }

    public boolean expired(StoreState.Cart cart) {
        return expired(cart, System.currentTimeMillis());
    }

    private boolean removable(StoreState.Cart cart) {
        return cart.attempt() == null || cart.paid() || "expired".equals(cart.attempt().status());
    }

    private void prune(StoreState next, long now) {
        next.carts.values().removeIf(cart -> expired(cart, now));
    }

    private boolean expired(StoreState.Cart cart, long now) {
        long retention = cart.lines().isEmpty() && cart.attempt() == null ? emptyTtlMillis : ttlMillis;
        return cart.updatedAt() < now - retention && removable(cart);
    }

    @PreDestroy
    @Override public synchronized void close() throws IOException {
        if (lock.isValid()) lock.release();
        if (lockChannel.isOpen()) lockChannel.close();
    }
}
