package com.finnyboyfab.store.persistence;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.*;

class LocalStoreTests {
    @TempDir Path directory;
    private LocalStore open(int max) { return new LocalStore(new ObjectMapper(), directory.toString(), 30, max, 2); }

    @Test void preventsTwoProcessesFromSharingStoreAndReleasesLockOnClose() throws Exception {
        try (LocalStore first = open(2)) {
            assertThatThrownBy(() -> open(2)).isInstanceOf(IllegalStateException.class);
        }
        try (LocalStore reopened = open(2)) { assertThat(reopened).isNotNull(); }
    }

    @Test void rejectsCorruptSnapshotInsteadOfSilentlyLosingPaymentHistory() throws Exception {
        Files.writeString(directory.resolve("store-state.json"), "{broken");
        assertThatThrownBy(() -> open(2)).isInstanceOf(IllegalStateException.class).hasMessageContaining("refusing to discard");
    }

    @Test void enforcesCapacityWithoutPublishingRejectedChanges() throws Exception {
        try (LocalStore store = open(1)) {
            store.change(state -> { state.carts.put("one", new StoreState.Cart(Map.of(), System.currentTimeMillis(), false, null)); return null; });
            assertThatThrownBy(() -> store.change(state -> { state.carts.put("two", new StoreState.Cart(Map.of(), System.currentTimeMillis(), false, null)); return null; }))
                    .hasMessageContaining("capacity");
            assertThat(store.<Integer>read(state -> state.carts.size())).isEqualTo(1);
        }
        try (LocalStore reopened = open(1)) { assertThat(reopened.<Integer>read(state -> state.carts.size())).isEqualTo(1); }
    }

    @Test void writeFailureDoesNotPublishStateAndBlocksFurtherMutations() throws Exception {
        try (LocalStore store = open(2)) {
            assertThat(store.healthy()).isTrue();
            Files.createDirectory(directory.resolve("store-state.next"));
            assertThatThrownBy(() -> store.change(state -> { state.carts.put("one", new StoreState.Cart(Map.of(), System.currentTimeMillis(), false, null)); return null; }))
                    .hasMessageContaining("Unable to save");
            assertThat(store.<Integer>read(state -> state.carts.size())).isZero();
            assertThat(store.healthy()).isFalse();
            assertThatThrownBy(() -> store.change(state -> null)).hasMessageContaining("needs recovery");
        }
    }

    @Test void prunesAbandonedEmptyCartsOnTheShorterTtl() throws Exception {
        try (LocalStore store = new LocalStore(new ObjectMapper(), directory.toString(), 30, 1, 2, 2)) {
            store.change(state -> {
                state.carts.put("empty", new StoreState.Cart(Map.of(), 0, false, null));
                return null;
            });
            store.change(state -> {
                state.carts.put("fresh", new StoreState.Cart(Map.of(), System.currentTimeMillis(), false, null));
                return null;
            });
            assertThat(store.<Boolean>read(state -> state.carts.containsKey("empty"))).isFalse();
            assertThat(store.<Boolean>read(state -> state.carts.containsKey("fresh"))).isTrue();
        }
    }
}
