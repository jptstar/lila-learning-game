export const smartGame={
  id:"smart",icon:"🧠",title:"Mélange malin",description:"Lila mélange les exercices sans répéter le même type deux fois de suite.",
  play(api){
    const ids=["find-image","find-letter","count","recognize-number","shapes","shadows","shape-hole","shape-rotation","gender"];
    const choices=ids.filter(id=>id!==api.state.lastSmartGame);
    const id=choices[api.rand(choices.length)]||ids[0];
    api.state.lastSmartGame=id;
    const game=api.getGame(id);api.setSmartSubgame(game);game.play(api);
  }
};
