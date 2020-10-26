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
  for(var i=0; i<POPULATION; i++){
    s.addCitizen()
  }
  s.addDomain('finance')
  s.addDomain('military')
  s.addDomain('publicSafety')
  s.addDomain('physics')
  s.addDomain('biology')
  for(var i=0; i<FACILITATORS_INITIAL_HEADCCOUNT; i++){
    let candidate = s.people[Random.number(0, s.people.length-1)]
    s.addFacilitator(new Facilitator(candidate))
  }
  for(var i=0; i<SUPREME_JUDGES_INITIAL_HEADCCOUNT; i++){
    let candidate = s.people[Random.number(0, s.people.length-1)]
    s.addSupremeJudge(new SupremeJudge(candidate))
  }
  for(var i=0; i<PROFESSIONALS_INITIAL_HEADCCOUNT_PER_DOMAIN; i++){
    for(var j=0; j<s.domains.length; j++){
      let candidate = s.people[Random.number(0, s.people.length-1)]
      s.addProfessional(s.domains[j], new Professional(candidate))
    }
  }
  for(var i=0; i<SIMULATE_FOR_DAYS*2; i++){
    s.tick();
  }

  trace(s)
})()