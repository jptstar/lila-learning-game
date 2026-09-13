export const smartGame={
  id:"smart",icon:"🧠",title:"Mélange malin",description:"Lila mélange les exercices et insiste doucement sur les erreurs.",
  play(api){
    const ids=["find-image","find-letter","count","recognize-number"];
    const id=ids[api.rand(ids.length)];const game=api.getGame(id);api.setSmartSubgame(game);game.play(api);
  }
};
