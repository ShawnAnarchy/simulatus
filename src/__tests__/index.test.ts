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
  TUNING,
  DELIBERATION_HEADCOUNT } from '../const'

const TEST_DOMAIN = 'test_domain';
const ENOUGH_POPULATION = 1000;

import * as fs from 'fs';
import * as Random from '../random';

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
} from '../util'

import {
  state,
  Snapshot,
  Citizen,
  Facilitator,
  Professional,
  SupremeJudge,
  Proposal,
  ProblemTypes,
  ProposalPhases,
  PersonalStatus
} from '../lib';

const context = describe;


describe('StateMachine', () => {
  describe('sampleCandidate', () => {
    it('should deal with the "refill" of anonymity set.', () => {
      let s = state.init();
      for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen();
      s.people = mapM(s.people, (k,v)=>{
        v.age = 16;
        v.lifetime = 32;
        v.status = PersonalStatus.CANDIDATE;
        return v;
      })
      for(var i=0; i<ENOUGH_POPULATION; i++) s.sampleCandidate();
      expect(s.sampleCandidateCache.length).toBe(ENOUGH_POPULATION);
      firstM(s.people).masquerade();
      expect(s.sampleCandidateCache.length).toBe(ENOUGH_POPULATION-1);
    });
  });
  describe('submitProposal', () => {
    it('should create new proposal.', () => {
      let s = state.init();
      for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen();
      s.people = mapM(s.people, (k,v)=>{
        v.age = 16;
        v.lifetime = 32;
        v.status = PersonalStatus.CANDIDATE;
        return v;
      });//avoid random failure
      let proposer = firstM(s.people);
      Snapshot.save(1);
      let proposal = s.submitProposal(proposer, ProblemTypes.NORMAL);
      expect(proposal.representatives.length).toBe(REPRESENTATIVE_HEADCOUNT);
      expect(proposal.representatives).toEqual(
        expect.not.arrayContaining([null,undefined])
      );
    })
  })
  describe('people', () => {
    it('should not have conflict.', () => {
      let s = state.init();
      for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen();
      expect(lengthM(s.people)).toBe(ENOUGH_POPULATION)
    })
  })
  describe('addFacilitator', () => {
    it('should be free as facilitator but cannot be a candidate of other roles.', () => {
      let s = state.get();
      let citizen = firstM(s.people) ? firstM(s.people) : s.addCitizen();

      let facilitator = new Facilitator(citizen);
      facilitator.status = PersonalStatus.CANDIDATE;
      facilitator.age = 16;
      facilitator.lifetime = 32;
      s.addFacilitator(facilitator);
      expect(s.facilitators[0].status).toBe(PersonalStatus.POOLED);
      expect(firstM(s.people).status).toBe(PersonalStatus.POOLED);
    });
    it('should omit a candidate less than 16yo.', () => {
      let s = state.get();
      let citizen = firstM(s.people);
      let facilitator = new Facilitator(citizen);
      facilitator.status = PersonalStatus.CANDIDATE;
      facilitator.age = 15;
      expect(()=>{
        s.addFacilitator(facilitator)
      }).toThrow('Too young to be a CRO.')
    })
    it('should omit a candidate who is busy.', () => {
      let s = state.get();
      let citizen = firstM(s.people);
      let facilitator = new Facilitator(citizen);
      facilitator.status = PersonalStatus.DELIBERATING;
      facilitator.age = 16;
      expect(()=>{
        s.addFacilitator(facilitator)
      }).toThrow('You cannot be a facilitator while you are in a deliberation.')
    })
  })
});
describe('Snapshot', () => {
  describe('save', () => {
    beforeAll(()=>{
      let s = state.init();
      DEFAULT_DOMAINS.map(d=> s.addDomain(d) );
      s.summaryStore = s.summary();
    });
    it('should add a record to the memory storage for population', () => {
      let s = state.get();
      expect(lengthM(s.people)).toBe(0);
      s.addCitizen().masquerade();
      expect(lengthM(s.people)).toBe(1);
      expect(s.records['population']).toBe(undefined);
      Snapshot.save(1);
      expect( lengthM(s.records['population']) ).toBe(1);
      s.addCitizen().masquerade();
      expect(lengthM(s.people)).toBe(2);
      Snapshot.save(2);
      expect( lengthM(s.records['population']) ).toBe(2);
    })
    it('should add a record to the memory storage for deliberating rate', () => {
      let s = state.get();

      for(var i=0; i<60; i++) s.addCitizen();
      s.people = mapM(s.people, (k,v)=>{
        v.age = 16;
        v.lifetime = 32;
        v.status = PersonalStatus.CANDIDATE;
        return v;
      })


      let proposer = firstM(s.people);
      let citizen = lastM(s.people);
      let facilitator = new Facilitator(citizen);
      let p = new Proposal(proposer, ProblemTypes.NORMAL);
      p.facilitator = facilitator;
      p.spentDays += 0.5; 
      s.proposals[p.id] = p;

      s.summaryStore = s.summary();
      Snapshot.save(3);
      let record = s.records['population_in_deliberation'];
      expect(record.hd2).toBe(0);
      expect(record.hd3).toBeGreaterThan(0);
    })
    it('should add a record to the memory storage for # of facilitator', () => {
      let s = state.get();
      firstM(s.people).status = PersonalStatus.CANDIDATE;
      firstM(s.people).age = 16;
      s.addFacilitator(new Facilitator(firstM(s.people)))
      Snapshot.save(4);
      let record = s.records['num_facilitator'];
      expect(record.hd3).toBe(0);
      expect(record.hd4).toBe(1);
    })
    it('should add a record to the memory storage for # of supreme judges', () => {
      let s = state.get();
      firstM(s.people).status = PersonalStatus.CANDIDATE;
      s.addSupremeJudge(new SupremeJudge(firstM(s.people)))
      Snapshot.save(5);
      let record = s.records['num_supremeJudge']
      expect(record.hd4).toBe(0);
      expect(record.hd5).toBe(1);
    })
    it('should add a record to the memory storage for # of ongoing proposals', () => {
      let s = state.get();
      for(var i=0; i<60; i++) s.addCitizen();
      s.people = mapM(s.people, (k,v)=>{
        v.age += 16;
        v.lifetime += 16;
        v.status = PersonalStatus.CANDIDATE;
        return v;
      })
      
      let proposer = s.sampleCandidate();
      let proposal = s.submitProposal(proposer, ProblemTypes.NORMAL)
      proposal.spentDays += 1;
      proposal.facilitator = new Facilitator(s.sampleCandidate());
      s.proposals[proposal.id] = proposal;
      s.summaryStore = s.summary();
      Snapshot.save(6);
      let record = s.records['num_proposalOngoing']
      expect(firstM(s.proposals).representatives.length).toBe(REPRESENTATIVE_HEADCOUNT);
      expect(record.hd5).toBe(1);
      expect(record.hd6).toBe(2);
    })
    it.skip('should add a record to the memory storage for the mixing cost', () => {
    })
    it.skip('should add a record to the memory storage for the participatry subsidy cost', (skip) => {
    })
    it.skip('should add a record to the memory storage for the gas subsidy cost', (skip) => {
    })
    it.skip('should add a record to the memory storage for the facilitator cost', (skip) => {
    })
    it.skip('should add a record to the memory storage for the professionals cost', (skip) => {
    })
    it.skip('should add a record to the memory storage for the supreme judges cost', (skip) => {
    })
    it.skip('should add a record to the memory storage for the phone and connection cost', (skip) => {
    })
  })
})

describe('Proposal', () => {
  describe('validate', () => {

    context('ProposalPhases.INITIAL_JUDGE', () => {
      it('should be failed due to the lack of reps.', () => {
        let s = state.init();
        let citizen = s.addCitizen();
        citizen.age = 16;
        citizen.lifetime = 32;
        citizen.status = PersonalStatus.CANDIDATE;
        let proposal = s.submitProposal(citizen, ProblemTypes.NORMAL);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.HEADCOUNT_UNREACHED);
        expect(lengthM(s.proposals)).toBe(1);
        expect(lengthM(s.people)).toBe(1);
        expect(proposal.representatives.length).toBeLessThan(REPRESENTATIVE_HEADCOUNT);
        expect(proposal.representatives).toEqual(
          expect.not.arrayContaining([null,undefined])
        );
        expect(proposal.representatives.filter(r=> r.status === PersonalStatus.DELIBERATING ).length).toBe(0);
      });
      it('should be failed because busy citizens cannot be reps.', () => {
        let s = state.init();
        for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen();
        s.people = mapM(s.people, (k,v)=>{
          v.status = PersonalStatus.DELIBERATING;
          return v;
        });
        let citizen = firstM(s.people);
        citizen.age = 16;
        citizen.lifetime = 32;
        citizen.status = PersonalStatus.CANDIDATE;
        let proposal = s.submitProposal(citizen, ProblemTypes.NORMAL);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.HEADCOUNT_UNREACHED);
        expect(lengthM(s.proposals)).toBe(1);
        expect(lengthM(s.people)).toBe(ENOUGH_POPULATION);
        expect(proposal.representatives.length).toBeLessThan(REPRESENTATIVE_HEADCOUNT);
        expect(proposal.representatives).toEqual(
          expect.not.arrayContaining([null,undefined])
        );
        expect(proposal.representatives.filter(r=> r.status === PersonalStatus.DELIBERATING ).length).toBe(0);
      });
      it('should be failed due to too young reps.', () => {
        let s = state.init();
        for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen();
        s.people = mapM(s.people, (k,v)=>{
          v.age = 15;
          v.status = PersonalStatus.CANDIDATE;
          return v;
        });
        let citizen = firstM(s.people);
        citizen.age = 16;
        citizen.lifetime = 32;
        citizen.status = PersonalStatus.CANDIDATE;
        let proposal = s.submitProposal(citizen, ProblemTypes.NORMAL);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.HEADCOUNT_UNREACHED);
        expect(lengthM(s.proposals)).toBe(1);
        expect(lengthM(s.people)).toBe(ENOUGH_POPULATION);
        expect(proposal.representatives.length).toBeLessThan(REPRESENTATIVE_HEADCOUNT);
        expect(proposal.representatives.filter(r=> r.status === PersonalStatus.DELIBERATING ).length).toBe(0);
      });
      it('should be successfully initialized.', () => {
        let s = state.init();
        for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen();
        s.people = mapM(s.people, (k,v)=>{
          v.age = 16;
          v.lifetime = 32;
          v.status = PersonalStatus.CANDIDATE;
          return v;
        });//avoid random failure
        let citizen = firstM(s.people);
        let proposal = s.submitProposal(citizen, ProblemTypes.NORMAL);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.INITIAL_JUDGE);
        expect(lengthM(s.proposals)).toBe(1);
        expect(lengthM(s.people)).toBe(ENOUGH_POPULATION);
        expect(proposal.representatives.length).toBe(REPRESENTATIVE_HEADCOUNT);
        expect(proposal.representatives).toEqual(
          expect.not.arrayContaining([null,undefined])
        );
        expect(proposal.representatives.filter(r=> r.status === PersonalStatus.DELIBERATING ).length).toBe(REPRESENTATIVE_HEADCOUNT);
      });
    });
    context('ProposalPhases.FACILITATOR_ASSIGNMENT', () => {
      it('should be true.', () => {
        let s = state.get();
        firstM(s.proposals).spentDays += 1;
        let proposal = firstM(s.proposals);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.FACILITATOR_ASSIGNMENT);
        expect(lengthM(s.proposals)).toBe(1);
        expect(lengthM(s.people)).toBe(ENOUGH_POPULATION);
        expect(proposal.representatives.filter(r=> r.status === PersonalStatus.DELIBERATING ).length).toBe(REPRESENTATIVE_HEADCOUNT);
      });
    });
    context('ProposalPhases.DOMAIN_ASSIGNMENT', () => {
      it('should be true.', () => {
        let s = state.get();
        firstM(s.people).status = PersonalStatus.CANDIDATE;
        firstM(s.people).age = 16;
        firstM(s.proposals).facilitator = new Facilitator(firstM(s.people));
        let proposal = firstM(s.proposals);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.DOMAIN_ASSIGNMENT);
        expect(lengthM(s.people)).toBe(ENOUGH_POPULATION);
        expect(proposal.representatives.filter(r=> r.status === PersonalStatus.DELIBERATING ).length).toBe(REPRESENTATIVE_HEADCOUNT);
      });
    });
    context('ProposalPhases.PROFESSIONAL_ASSIGNMENT', () => {
      it('should be true.', () => {
        let s = state.get();
        firstM(s.proposals).domains = [TEST_DOMAIN];
        let proposal = firstM(s.proposals);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.PROFESSIONAL_ASSIGNMENT);
        expect(proposal.representatives.filter(r=> r.status === PersonalStatus.DELIBERATING ).length).toBe(REPRESENTATIVE_HEADCOUNT);
      });
    });
    context('ProposalPhases.DELIBERATION', () => {
      it('should be true.', () => {
        let s = state.get();
        firstM(s.people).status = PersonalStatus.CANDIDATE;
        firstM(s.people).age = 16;
        s.professionals[TEST_DOMAIN] = [new Professional(firstM(s.people))];
        firstM(s.proposals).professionals = [s.professionals[TEST_DOMAIN][0]];
        let proposal = firstM(s.proposals);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.DELIBERATION);
        expect(lengthM(s.people)).toBe(ENOUGH_POPULATION);
        expect(proposal.representatives.filter(r=> r.status === PersonalStatus.DELIBERATING ).length).toBe(REPRESENTATIVE_HEADCOUNT);
      });
    });
    context('ProposalPhases.FINAL_JUDGE', () => {
      it('should be true.', () => {
        let s = state.get();
        firstM(s.proposals).spentDays = firstM(s.proposals).durationDays
        let proposal = firstM(s.proposals);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.FINAL_JUDGE);
        expect(proposal.representatives.filter(r=> r.status === PersonalStatus.DELIBERATING ).length).toBe(REPRESENTATIVE_HEADCOUNT);
      });
    });
    context('ProposalPhases.FINISHED', () => {
      it('should be true and a miscellaneousAdministration should be added.', () => {
        let s = state.get();
        firstM(s.proposals).representatives = firstM(s.proposals).representatives.map(r=>{
          r.humanrightsPreference = 1000;
          r.progressismPreference = 1000;
          return r;
        });
        firstM(s.proposals).humanrightsDegree = 100;
        firstM(s.proposals).progressismDegree = 100;
        let proposal = firstM(s.proposals);
        proposal.tick();
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.FINISHED);
        expect(s.miscellaneousAdministrations.length).toBeGreaterThan(0);
        expect(proposal.representatives.filter(r=> r.status === PersonalStatus.DELIBERATING ).length).toBe(0);
      });
      it('should be consistent regarding population', ()=>{
        let s = state.get();
        expect(lengthM(s.people)).toBe(ENOUGH_POPULATION)
      })
    });
  })
  describe('tick', () => {
    context('init and tick', () => {
      it('should be the finished phase with IQ <= 50 proposer.', () => {
        let s = state.init();
        for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen();
        s.people = mapM(s.people, (k,v)=>{
          v.age = 16;
          v.lifetime = 32;
          v.status = PersonalStatus.CANDIDATE;
          return v;
        });//avoid random failure
        let proposer = firstM(s.people);
        proposer.intelligenceDeviation = 50;
        let proposal = s.submitProposal(proposer, ProblemTypes.NORMAL);
        expect(proposal.proposer.status).toBe(PersonalStatus.DELIBERATING);
        expect(firstM(s.people).status).toBe(PersonalStatus.DELIBERATING);
        s.tick();
        expect(proposal.validate().code).toBe(ProposalPhases.FINISHED);
        expect(proposal.isFinished).toBe(true);
        expect(proposal.proposer.status).toBe(PersonalStatus.INACTIVE);
        expect(firstM(s.people).status).toBe(PersonalStatus.INACTIVE);
      });
      it('should be the facilitator assignment phase with IQ > 50 proposer.', () => {
        let s = state.init();
        for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen();
        // s.summaryStore = s.summary();
        s.people = mapM(s.people, (k,v)=>{
          v.age = 16;
          v.lifetime = 32;
          v.status = PersonalStatus.CANDIDATE;
          return v;
        });//avoid random failure
        let proposer = firstM(s.people);
        proposer.intelligenceDeviation = 50.1;
        // Snapshot.save(1);
        s.submitProposal(proposer, ProblemTypes.NORMAL);
        s.tick();
        expect(firstM(s.proposals).validate().code).toBe(ProposalPhases.FACILITATOR_ASSIGNMENT);
      });
    });
  })
})

  