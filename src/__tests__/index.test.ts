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
        let s = state.get();
        let citizen = s.addCitizen();
        let proposal = s.submitProposal(citizen, ProblemTypes.NORMAL);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.INITIAL_JUDGE);
        expect(s.proposals.length).toBe(1);
        expect(s.people.length).toBe(1);
      });
    });
    context('ProposalPhases.FACILITATOR_ASSIGNMENT', () => {
      it('should be true.', () => {
        let s = state.get();
        s.proposals[0].spentDays += 1;
        let proposal = s.proposals[0];
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.FACILITATOR_ASSIGNMENT);
        expect(s.proposals.length).toBe(1);
        expect(s.people.length).toBe(1);
      });
    });
    context('ProposalPhases.DOMAIN_ASSIGNMENT', () => {
      it('should be true.', () => {
        let s = state.get();
        s.proposals[0].facilitator = new Facilitator(s.addCitizen());
        let proposal = s.proposals[0];
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.DOMAIN_ASSIGNMENT);
        expect(s.people.length).toBe(2);
      });
    });
  })
})