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
import { state, Facilitator, Professional, SupremeJudge } from './lib';
let trace = Util.trace;

(function(){
  let s = state.get();
  s.setup(POPULATION);

  for(var i=0; i<SIMULATE_FOR_DAYS*2; i++){
    s.tick();
  }
  trace(s)
})()