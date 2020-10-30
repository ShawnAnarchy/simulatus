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
    s.tick();
    Snapshot.save(halfdays);

    if((i/2)%1 === 0){
      let summary = s.summary();
      console.log(`day${i/2} with freeRatio=${summary.freeRatio}%  ${summary.ongoingProposals}props`) 
    }
  }
  console.log(`ticking finished!`)

  writeRecords();
  trace(s.debugger);
})()