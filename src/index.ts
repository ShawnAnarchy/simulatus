import {
  TICKING_TIME,
  POPULATION,
  SIMULATE_FOR_DAYS,
  FACILITATORS_INITIAL_HEADCCOUNT,
  PROFESSIONALS_INITIAL_HEADCCOUNT_PER_DOMAIN,
  SUPREME_JUDGES_INITIAL_HEADCCOUNT,
  UPPERBOUND,
  LOWERBOUND } from './const';

import * as Random from './random';
import * as Util from './util';
import { state, Snapshot, Facilitator, Professional, SupremeJudge } from './lib';
let trace = Util.trace;
let writeRecords = Util.writeRecords;

(function(){
  let s = state.get();
  state.setup(POPULATION);

  console.log(`ticking started...`) 
  for(var i=0; i<SIMULATE_FOR_DAYS*2; i++){
    let halfdays = (i+1)/2;
    s.lap('main_a');
    s.tick();
    s.lap('main_b');
    Snapshot.save(halfdays);
    s.lap('main_c');

    let tempo;
    if(POPULATION > 20000){
      tempo = 0.5;
    } else if (POPULATION > 10000) {
      tempo = 1;
    } else if (POPULATION > 5000) {
      tempo = 7;
    } else {
      tempo = 30;
    }

    s.lap('main_c');
    if((i/2)%tempo === 0){
      let summary = s.summaryStore;
      s.lap('main_e');
      console.log(`day${i/2} with freeRatio=${summary.freeRatio}%  ${summary.ongoingProposals}props  bottleneck:${summary.bottleneck}`) 
      // s.lap('main_f');
      // writeRecords();
      // s.lap('main_g');
      // trace(s.bottleneck, "bottleneck");
      // s.lap('main_h');
    }
    s.lap('main_d');
  }
  console.log(`ticking finished!`)

  writeRecords();
  trace(s.bottleneck, "bottleneck");
})()