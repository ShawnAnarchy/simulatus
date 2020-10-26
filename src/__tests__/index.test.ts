import {
  TICKING_TIME,
  POPULATION,
  SIMULATE_FOR_DAYS,
  FACILITATORS_INITIAL_HEADCCOUNT,
  PROFESSIONALS_INITIAL_HEADCCOUNT_PER_DOMAIN,
  SUPREME_JUDGES_INITIAL_HEADCCOUNT,
  UPPERBOUND,
  LOWERBOUND } from '../const';

import * as Random from '../random';
import * as Util from '../util';
import {
  state,
  Facilitator,
  Professional,
  SupremeJudge,
  Proposal,
  ProblemTypes,
  ProposalPhases } from '../lib';
  

const context = describe;

describe('Proposal', () => {
  describe('tick', () => {
    context('ProposalPhases.INITIAL_JUDGE', () => {
      it('should be initialized.', () => {
        // let s = state.get();
        // let citizen = s.addCitizen();
        // let proposal = new Proposal(citizen, ProblemTypes.NORMAL);
        // let validationResult = proposal.validate();
        // expect(validationResult.code).toBe(ProposalPhases.INITIAL_JUDGE);
      });
    });
  })
})