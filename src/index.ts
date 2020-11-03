import {
  TICKING_TIME,
  POPULATION,
  SIMULATE_FOR_DAYS,
  FACILITATORS_INITIAL_HEADCCOUNT,
  PROFESSIONALS_INITIAL_HEADCCOUNT_PER_DOMAIN,
  SUPREME_JUDGES_INITIAL_HEADCCOUNT,
  UPPERBOUND,
  LOWERBOUND,
  REPRESENTATIVE_HEADCOUNT,
  DEFAULT_DOMAINS,
  PARTICIPATION_THRESHOLD,
  BOTTLENECK_THRESHOLD,
  TUNING,
  DELIBERATION_HEADCOUNT } from './const'

import * as Random from './random';

import {
  fetchRecord,
  deleteRecordAll,
  writeRecords,
  trace,
  squash,
  shuffle,
  stringify,
  uniq,
  mapM,
  filterM,
  firstM,
  lastM,
  keyM,
  valueM,
  lengthM,
  squashM,
  sampleM
} from './util'
import { state, Snapshot, Facilitator, Professional, SupremeJudge } from './lib';

(function(){
  let s = state.get();
  state.setup(POPULATION);

  console.log(`ticking started...`) 
  for(var i=0; i<SIMULATE_FOR_DAYS*2; i++){
    let halfdays = (i+1)/2;
    s.summaryStore = s.summary();
    s.tick();
    Snapshot.save(halfdays);
    let tempo = 1;
    if((i/2)%tempo === 0){
      s.tickReport(i);
      // writeRecords();
      // trace(s.bottleneck, "bottleneck");
    }
  }
  console.log(`ticking finished!`)

  writeRecords();
  trace(s.bottleneck, "bottleneck");
})()