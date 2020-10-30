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
  DEFAULT_DOMAINS } from '../const';

const TEST_DOMAIN = 'test_domain';
const ENOUGH_POPULATION = 200;

import * as fs from 'fs';
import * as Random from '../random';
import * as Util from '../util';
import {
  state,
  Snapshot,
  Facilitator,
  Professional,
  SupremeJudge,
  Proposal,
  ProblemTypes,
  ProposalPhases,
  PersonalStatus
} from '../lib';
  
const {
  fetchRecord,
  mapM,
  filterM,
  firstM,
  lastM,
  keyM,
  valueM,
  lengthM,
  uniqM
} = Util;

const context = describe;


describe('StateMachine', () => {
  describe('submitProposal', () => {
    it('should create new proposal.', () => {
      let s = state.init();
      for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen().masquerade();
      s.people = mapM(s.people, (k,v)=>{ v.age += 16; return v; });//avoid random failure
      let proposer = firstM(s.people).masquerade();
      proposer.masquerade();
      s.submitProposal(proposer, ProblemTypes.NORMAL);
      expect(firstM(s.proposals).representatives.length).toBe(REPRESENTATIVE_HEADCOUNT);
      expect(firstM(s.proposals).representatives).toEqual(
        expect.not.arrayContaining([null,undefined])
      );
    })
  })
  describe('people', () => {
    it('should not have conflict.', () => {
      let s = state.init();
      for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen().masquerade();
      expect(lengthM(s.people)).toBe(ENOUGH_POPULATION)
      expect(lengthM(uniqM(mapM(s.people, (k,v)=>v)))).toBe(ENOUGH_POPULATION)
    })
  })
  describe('addFacilitator', () => {
    it('should be free as facilitator but cannot be a candidate of other roles.', () => {
      let s = state.get();
      let citizen = firstM(s.people) ? firstM(s.people) : s.addCitizen().masquerade();

      let facilitator = new Facilitator(citizen);
      facilitator.masquerade();
      facilitator.age = 16;
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
    context('StateMachine', () => {
      beforeAll(()=>{
        let s = state.init();
        DEFAULT_DOMAINS.map(d=> s.addDomain(d) );
        Util.deleteRecordAll();
      });
      it('should add a record to the memory storage for population', () => {
        let s = state.get();
        expect(lengthM(s.people)).toBe(0);
        s.addCitizen().masquerade();
        expect(lengthM(s.people)).toBe(1);
        expect(s.records['population']).toBe(undefined);
        Snapshot.save(1);
        expect(Object.keys(s.records['population']).length).toBe(1);
        s.addCitizen().masquerade();
        expect(lengthM(s.people)).toBe(2);
        Snapshot.save(2);
        expect(Object.keys(s.records['population']).length).toBe(2);
      })
      it('should add a record to the memory storage for deliberating rate', () => {
        let s = state.get();
        firstM(s.people).status = PersonalStatus.DELIBERATING;
        Snapshot.save(3);
        let record = s.records['population_in_deliberation'];
        expect(record.hd2).toBe(0);
        expect(record.hd3).toBe(1);
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
      it('should add a record to the memory storage for # of professionals', () => {
        let s = state.get();
        firstM(s.people).status = PersonalStatus.CANDIDATE;
        s.addProfessional(s.domains[0], new Professional(firstM(s.people)))
        Snapshot.save(5);
        let record = s.records[`num_professional_${s.domains[0]}`]
        expect(record.hd4).toBe(0);
        expect(record.hd5).toBe(1);
      })
      it('should add a record to the memory storage for # of supreme judges', () => {
        let s = state.get();
        firstM(s.people).status = PersonalStatus.CANDIDATE;
        s.addSupremeJudge(new SupremeJudge(firstM(s.people)))
        Snapshot.save(6);
        let record = s.records['num_supremeJudge']
        expect(record.hd5).toBe(0);
        expect(record.hd6).toBe(1);
      })
      it('should add a record to the memory storage for # of ongoing proposals', () => {
        let s = state.get();
        for(var i=0; i<60; i++) s.addCitizen().masquerade();
        firstM(s.people).status = PersonalStatus.CANDIDATE;
        s.submitProposal(firstM(s.people), ProblemTypes.NORMAL)
        firstM(s.proposals).spentDays += 1;
        firstM(s.proposals).facilitator = new Facilitator(firstM(s.people));
        Snapshot.save(7);
        let record = s.records['num_proposalOngoing']
        expect(record.hd6).toBe(0);
        expect(record.hd7).toBe(1);
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
  describe('scenario test', () => {
    beforeAll(()=>{
      let s = state.init();
      // let s = state.init();
      state.setup(POPULATION);
    
      for(var i=0; i<15*2; i++){
        let halfdays = (i+1)/2;
        s.tick();
        Snapshot.save(halfdays);
      }
    })
    it('should have the same # of ongoing proposals and busy facilitators.', () => {
      let s = state.get();
      let keys1 = Object.keys(s.records['num_facilitator_in_deliberation']);
      let lastKey1 = keys1[keys1.length-1];
      let BUSY_FACILITATOR_COUNT = s.records['num_facilitator_in_deliberation'][lastKey1]
      let keys2 = Object.keys(s.records['num_proposalOngoing']);
      let lastKey2 = keys1[keys1.length-1];
      let ONGOING_PROPOSALS_COUNT = s.records['num_proposalOngoing'][lastKey2]

      let keys3 = Object.keys(s.records['num_proposals']);
      let lastKey3 = keys1[keys1.length-1];
      let PROPOSALS_COUNT = s.records['num_proposals'][lastKey2]

      expect(ONGOING_PROPOSALS_COUNT).toBeLessThan(PROPOSALS_COUNT);
      expect(ONGOING_PROPOSALS_COUNT).toBe(BUSY_FACILITATOR_COUNT);
    })
    it('should have approved proposal.', () => {
      let s = state.get();
      let APPROVED_PROPOSALS_COUNT = Object.keys(s.records['num_proposalApproved']).length
      expect(APPROVED_PROPOSALS_COUNT).toBeGreaterThan(0);
    })
  })
})

describe('Proposal', () => {
  describe('validate', () => {

    context('ProposalPhases.INITIAL_JUDGE', () => {
      it('should be failed due to the lack of reps.', () => {
        let s = state.init();
        let citizen = s.addCitizen().masquerade();
        citizen.age = 16;
        let proposal = s.submitProposal(citizen, ProblemTypes.NORMAL);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.UNKNOWN_ERROR);
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
        for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen().masquerade();
        s.people = mapM(s.people, (k,v)=>{
          v.status = PersonalStatus.DELIBERATING;
          return v;
        });
        let citizen = firstM(s.people);
        citizen.status = PersonalStatus.CANDIDATE;
        citizen.age = 16;
        let proposal = s.submitProposal(citizen, ProblemTypes.NORMAL);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.UNKNOWN_ERROR);
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
        for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen().masquerade();
        s.people = mapM(s.people, (k,v)=>{ v.age = 15; return v; });
        let citizen = firstM(s.people);
        citizen.status = PersonalStatus.CANDIDATE;
        citizen.age = 16;
        let proposal = s.submitProposal(citizen, ProblemTypes.NORMAL);
        let validationResult = proposal.validate();
        expect(validationResult.code).toBe(ProposalPhases.UNKNOWN_ERROR);
        expect(lengthM(s.proposals)).toBe(1);
        expect(lengthM(s.people)).toBe(ENOUGH_POPULATION);
        expect(proposal.representatives.length).toBeLessThan(REPRESENTATIVE_HEADCOUNT);
        expect(proposal.representatives.filter(r=> r.status === PersonalStatus.DELIBERATING ).length).toBe(0);
      });
      it('should be successfully initialized.', () => {
        let s = state.init();
        for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen().masquerade();
        s.people = mapM(s.people, (k,v)=>{ v.age += 16; return v; });//avoid random failure
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
      it('No id confliction after a proposal', ()=>{
        let s = state.get();
        expect(lengthM(uniqM(mapM(s.people, (k,v)=>v)))).toBe(ENOUGH_POPULATION)
      })
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
      it('No id confliction after a proposal', ()=>{
        let s = state.get();
        expect(lengthM(uniqM(mapM(s.people, (k,v)=>v)))).toBe(ENOUGH_POPULATION)
      })
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
      it('No id confliction after a proposal', ()=>{
        let s = state.get();
        expect(lengthM(uniqM(mapM(s.people, (k,v)=>v)))).toBe(ENOUGH_POPULATION)
      })
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
      it('No id confliction after a proposal', ()=>{
        let s = state.get();
        expect(lengthM(uniqM(mapM(s.people, (k,v)=>v)))).toBe(ENOUGH_POPULATION)
      })
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
        for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen().masquerade();
        s.people = mapM(s.people, (k,v)=>{ v.age += 16; return v; });//avoid random failure
        let proposer = firstM(s.people).masquerade();
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
        for(var i=0; i<ENOUGH_POPULATION; i++) s.addCitizen().masquerade();
        s.people = mapM(s.people, (k,v)=>{
          v.age += 16;
          v.masquerade();
          return v;
        });//avoid random failure
        let proposer = firstM(s.people).masquerade();
        proposer.intelligenceDeviation = 50.1;
        s.submitProposal(proposer, ProblemTypes.NORMAL);
        s.tick();
        expect(firstM(s.proposals).validate().code).toBe(ProposalPhases.FACILITATOR_ASSIGNMENT);
      });
    });
  })
})

  