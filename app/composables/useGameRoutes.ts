import {
  getGameRouteConfig as fallbackRouteConfig,
  hasGameRouteDefinition,
  resolveGameRouteId,
  type GameRouteDefinition
} from '../constants/gameRoutes'

/**
 * Resolve a configuracao tecnica de um jogo dando precedencia ao que o admin
 * salvou em /admin/visual, e caindo em app/constants/gameRoutes.ts quando o
 * campo estiver vazio.
 *
 * Regra importante: se o gameId nao tem definicao no arquivo de fallback (ou
 * seja, e um jogo criado pelo painel), a base fica VAZIA. Antes, getGameRouteConfig
 * devolvia silenciosamente a config do bac-bo nesse caso, e um jogo novo abria
 * Bac Bo sem nenhum erro na tela.
 */
export const useGameRoutes = () => {
  const { config } = useVisualConfig()

  /**
  * Mesma regra de /jogo/[id].vue: casa pelo gameId do card ou pelo ultimo
  * segmento da rota. O `route` e editavel no painel e pode divergir do gameId —
  * casar so por gameId fazia o card perder todo o bloco tecnico.
  */
  const findManaged = (gameId: string) => {
    const games = config.value.games
    const byId = games.find(game => game.gameId === gameId)
    if (byId) return byId
    const byRoute = games.find(game => (game.route.match(/\/jogo\/([^/?#]+)/) || [])[1] === gameId)
    return byRoute || null
  }

  const emptyBase = (gameId: string): GameRouteDefinition => ({
    id: gameId,
    displayName: '',
    provider: '',
    resolvedId: gameId
  })

  const getGameRouteConfig = (gameId: string): GameRouteDefinition => {
    const base = hasGameRouteDefinition(resolveGameRouteId(gameId))
      ? fallbackRouteConfig(gameId)
      : emptyBase(gameId)

    const managed = findManaged(gameId)
    if (!managed) return { ...base, displayName: base.displayName || gameId }

    return {
      ...base,
      // Sem fallback, telas como `Historico do ${displayName}` saiam com o nome vazio.
      displayName: managed.title || base.displayName || gameId,
      provider: managed.description || base.provider,
      startGameSlug: managed.startGameSlug || base.startGameSlug,
      catalogador: managed.catalogadorCollection && managed.catalogadorGame
        ? {
            collection: managed.catalogadorCollection,
            game: managed.catalogadorGame,
            fallbackGames: managed.catalogadorFallbackGames || []
          }
        : base.catalogador,
      signalRef: managed.signalCollection && managed.signalName
        ? { collection: managed.signalCollection, name: managed.signalName }
        : base.signalRef
    }
  }

  const getCatalogadorQueries = (gameId: string): Array<{ collection: string; game: string }> => {
    const catalogador = getGameRouteConfig(gameId).catalogador
    if (!catalogador) return []
    const games = [catalogador.game, ...(catalogador.fallbackGames || [])]
    return Array.from(new Set(games)).map(game => ({ collection: catalogador.collection, game }))
  }

  /** WebSocket configurado no painel. Vazio deixa o useGame usar o padrao. */
  const getSignalUrl = (gameId: string): string => findManaged(gameId)?.signalUrl || ''

  return { getGameRouteConfig, getCatalogadorQueries, resolveGameRouteId, getSignalUrl }
}
