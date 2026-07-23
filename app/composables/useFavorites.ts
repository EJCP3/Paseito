// Composable — useFavorites
// "Mi Lista" ligada a la cuenta (tabla Favorite): requiere sesión para poder
// guardar y así el contador de guardados del vendedor sea real, no solo local.
const favoriteListings = ref<any[]>([])
let loadedFor: string | null = null

export function useFavorites() {
  const { isAuthenticated, user, openLogin } = useAuth()

  async function load() {
    if (!isAuthenticated.value) {
      favoriteListings.value = []
      loadedFor = null
      return
    }
    if (loadedFor === user.value!.id) return
    loadedFor = user.value!.id
    favoriteListings.value = await $fetch<any[]>('/api/favorites')
  }

  onMounted(load)
  watch(isAuthenticated, load)

  const count = computed(() => favoriteListings.value.length)
  const isFavorite = (id: string) => favoriteListings.value.some((l) => l.id === id)

  // Recibe el listado completo (no solo el id) para poder mostrarlo de una en "Mi Lista"
  // sin tener que rehacer el fetch completo apenas se guarda.
  async function toggle(listing: { id: string }) {
    if (!isAuthenticated.value) {
      openLogin()
      return
    }
    const { favorited } = await $fetch<{ favorited: boolean }>('/api/favorites/toggle', {
      method: 'POST',
      body: { listingId: listing.id },
    })
    if (favorited) {
      favoriteListings.value = [listing, ...favoriteListings.value]
    } else {
      favoriteListings.value = favoriteListings.value.filter((l) => l.id !== listing.id)
    }
  }

  return { favoriteListings, count, isFavorite, toggle }
}
