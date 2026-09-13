export const smartGame={
  id:"smart",icon:"🧠",title:"Mélange malin",description:"Lila mélange les exercices et varie les questions.",
  play(api){
    const ids=["find-image","find-letter","count","recognize-number"];
    const choices=ids.filter(id=>id!==api.state.lastSmartGame);
    const id=choices[api.rand(choices.length)]||ids[0];
    api.state.lastSmartGame=id;
    const game=api.getGame(id);api.setSmartSubgame(game);game.play(api);
  }
};
