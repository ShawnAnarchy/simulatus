import {
  TICKING_TIME,
  POPULATION,
  SIMULATE_FOR_DAYS,
  FACILITATORS_INITIAL_HEADCCOUNT,
  PROFESSIONALS_INITIAL_HEADCCOUNT_PER_DOMAIN,
  SUPREME_JUDGES_INITIAL_HEADCCOUNT,
  UPPERBOUND,
  LOWERBOUND,
  REPRESENTATIVE_HEADCOUNT } from '../const';

const TEST_DOMAIN = 'test_domain';
const ENOUGH_POPULATION = 200;

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


describe('StateMachine', () => {
  describe('submitProposal', () => {
    it('should create new proposal.', () => {
      let s = state.init();
      for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen();
      s.people = s.people.map(p=>{ p.age += 16; return p; });//avoid random failure
      let proposer = s.people[0];
      s.submitProposal(proposer, ProblemTypes.NORMAL);
      expect(s.proposals[0].representatives.length).toBe(REPRESENTATIVE_HEADCOUNT);
      expect(s.proposals[0].representatives).toEqual(
        expect.not.arrayContaining([null,undefined])
      );
    })
  })
  describe('people', () => {
    it('should not have conflict.', () => {
      let s = state.init();
      for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen();
      expect(s.people.length).toBe(ENOUGH_POPULATION)
      expect(Util.uniq(s.people.map(p=>p.id)).length).toBe(ENOUGH_POPULATION)
    })
  })
  describe('multi-round tests', () => {
    it('should not assign a citizen for multiple proposals at once.', () => {
      let s = state.init();
      state.setup(POPULATION);
      for(var i=0; i<SIMULATE_FOR_DAYS*2; i++){
        s.tick();
      }
      expect(s.people.length).toBe(POPULATION)

    })
  })
})

describe('Proposal', () => {
  describe('validate', () => {

    context('ProposalPhases.INITIAL_JUDGE', () => {
      it('should be failed due to the lack of reps.', () => {
        let s = state.init();
        let citizen = s.addCitizen();
        let proposal = s.submitProposal(citizen, ProblemTypes.NORMAL);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.UNKNOWN_ERROR);
        expect(s.proposals.length).toBe(1);
        expect(s.people.length).toBe(1);
        expect(proposal.representatives.length).toBeLessThan(REPRESENTATIVE_HEADCOUNT);
        expect(proposal.representatives).toEqual(
          expect.not.arrayContaining([null,undefined])
        );
        expect(proposal.representatives.filter(r=> r.isBusy ).length).toBe(0);
      });
      it('should be failed due to busy citizens.', () => {
        let s = state.init();
        for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen();
        s.people = s.people.map(p=>{ p.isBusy = true; return p; });
        let citizen = s.people[0];
        let proposal = s.submitProposal(citizen, ProblemTypes.NORMAL);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.UNKNOWN_ERROR);
        expect(s.proposals.length).toBe(1);
        expect(s.people.length).toBe(ENOUGH_POPULATION);
        expect(proposal.representatives.length).toBeLessThan(REPRESENTATIVE_HEADCOUNT);
        expect(proposal.representatives).toEqual(
          expect.not.arrayContaining([null,undefined])
        );
        expect(proposal.representatives.filter(r=> r.isBusy ).length).toBe(0);
      });
      it('should be failed due to too young reps.', () => {
        let s = state.init();
        for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen();
        s.people = s.people.map(p=>{ p.age = 15; return p; });
        let citizen = s.people[0];
        let proposal = s.submitProposal(citizen, ProblemTypes.NORMAL);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.UNKNOWN_ERROR);
        expect(s.proposals.length).toBe(1);
        expect(s.people.length).toBe(ENOUGH_POPULATION);
        expect(proposal.representatives.length).toBeLessThan(REPRESENTATIVE_HEADCOUNT);
        expect(proposal.representatives.filter(r=> r.isBusy ).length).toBe(0);
      });
      it('should be successfully initialized.', () => {
        let s = state.init();
        for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen();
        s.people = s.people.map(p=>{ p.age += 16; return p; });//avoid random failure
        let citizen = s.people[0];
        let proposal = s.submitProposal(citizen, ProblemTypes.NORMAL);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.INITIAL_JUDGE);
        expect(s.proposals.length).toBe(1);
        expect(s.people.length).toBe(ENOUGH_POPULATION);
        expect(proposal.representatives.length).toBe(REPRESENTATIVE_HEADCOUNT);
        expect(proposal.representatives).toEqual(
          expect.not.arrayContaining([null,undefined])
        );
        expect(proposal.representatives.filter(r=> r.isBusy ).length).toBe(REPRESENTATIVE_HEADCOUNT);
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
        expect(s.people.length).toBe(ENOUGH_POPULATION);
        expect(proposal.representatives.filter(r=> r.isBusy ).length).toBe(REPRESENTATIVE_HEADCOUNT);
      });
    });
    context('ProposalPhases.DOMAIN_ASSIGNMENT', () => {
      it('should be true.', () => {
        let s = state.get();
        s.proposals[0].facilitator = new Facilitator(s.people[0]);
        let proposal = s.proposals[0];
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.DOMAIN_ASSIGNMENT);
        expect(s.people.length).toBe(ENOUGH_POPULATION);
        expect(proposal.representatives.filter(r=> r.isBusy ).length).toBe(REPRESENTATIVE_HEADCOUNT);
      });
    });
    context('ProposalPhases.PROFESSIONAL_ASSIGNMENT', () => {
      it('should be true.', () => {
        let s = state.get();
        s.proposals[0].domains = [TEST_DOMAIN];
        let proposal = s.proposals[0];
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.PROFESSIONAL_ASSIGNMENT);
        expect(proposal.representatives.filter(r=> r.isBusy ).length).toBe(REPRESENTATIVE_HEADCOUNT);
      });
      it('No id confliction after a proposal', ()=>{
        expect(Util.uniq(state.get().people.map(p=>p.id)).length).toBe(ENOUGH_POPULATION)
      })
    });
    context('ProposalPhases.DELIBERATION', () => {
      it('should be true.', () => {
        let s = state.get();
        s.professionals[TEST_DOMAIN] = [s.people[0]];
        s.proposals[0].professionals = [s.professionals[TEST_DOMAIN][0]];
        let proposal = s.proposals[0];
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.DELIBERATION);
        expect(s.people.length).toBe(ENOUGH_POPULATION);
        expect(proposal.representatives.filter(r=> r.isBusy ).length).toBe(REPRESENTATIVE_HEADCOUNT);
      });
      it('No id confliction after a proposal', ()=>{
        expect(Util.uniq(state.get().people.map(p=>p.id)).length).toBe(ENOUGH_POPULATION)
      })
    });
    context('ProposalPhases.FINAL_JUDGE', () => {
      it('should be true.', () => {
        let s = state.get();
        s.proposals[0].spentDays = s.proposals[0].durationDays
        let proposal = s.proposals[0];
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.FINAL_JUDGE);
        expect(proposal.representatives.filter(r=> r.isBusy ).length).toBe(REPRESENTATIVE_HEADCOUNT);
      });
      it('No id confliction after a proposal', ()=>{
        expect(Util.uniq(state.get().people.map(p=>p.id)).length).toBe(ENOUGH_POPULATION)
      })
    });
    context('ProposalPhases.FINISHED', () => {
      it('should be true and a miscellaneousAdministration should be added.', () => {
        let s = state.get();
        s.proposals[0].representatives = s.proposals[0].representatives.map(r=>{
          r.humanrightsPreference = 1000;
          r.progressismPreference = 1000;
          return r;
        });
        s.proposals[0].humanrightsDegree = 100;
        s.proposals[0].progressismDegree = 100;
        let proposal = s.proposals[0];
        proposal.tick();
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.FINISHED);
        expect(s.miscellaneousAdministrations.length).toBeGreaterThan(0);
        expect(proposal.representatives.filter(r=> r.isBusy ).length).toBe(0);
      });
      it('No id confliction after a proposal', ()=>{
        expect(Util.uniq(state.get().people.map(p=>p.id)).length).toBe(ENOUGH_POPULATION)
      })
      it('should be consistent regarding population', ()=>{
        expect(state.get().people.length).toBe(ENOUGH_POPULATION)
      })
    });
  })
  describe('tick', () => {
    context('init and tick', () => {
      it('should be the finished phase with IQ <= 50 proposer.', () => {
        let s = state.init();
        for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen();
        s.people = s.people.map(p=>{ p.age += 16; return p; });//avoid random failure
        let proposer = s.people[0];
        proposer.intelligenceDeviation = 50;
        let proposal = s.submitProposal(proposer, ProblemTypes.NORMAL);
        expect(proposal.proposer.isBusy).toBe(true);
        expect(s.people[0].isBusy).toBe(true);
        s.tick();
        expect(proposal.validate().code).toBe(ProposalPhases.FINISHED);
        expect(proposal.isFinished).toBe(true);
        expect(proposal.proposer.isBusy).toBe(false);
        expect(s.people[0].isBusy).toBe(false);
      });
      it('should be the facilitator assignment phase with IQ > 50 proposer.', () => {
        let s = state.init();
        for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen();
        s.people = s.people.map(p=>{ p.age += 16; return p; });//avoid random failure
        let proposer = s.people[0];
        proposer.intelligenceDeviation = 50.1;
        s.submitProposal(proposer, ProblemTypes.NORMAL);
        s.tick();
        expect(s.proposals[0].validate().code).toBe(ProposalPhases.FACILITATOR_ASSIGNMENT);
      });
    });
  })
})