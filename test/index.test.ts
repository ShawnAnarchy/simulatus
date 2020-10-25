import {
  TICKING_TIME,
  POPULATION,
  SIMULATE_FOR_DAYS,
  FACILITATORS_INITIAL_HEADCCOUNT,
  PROFESSIONALS_INITIAL_HEADCCOUNT_PER_DOMAIN,
  SUPREME_JUDGES_INITIAL_HEADCCOUNT,
  UPPERBOUND,
  LOWERBOUND } from '../src/const'

const context = describe;

describe('Proposal', () => {
  describe('tick', () => {
    context('ProposalPhases.INITIAL_JUDGE', () => {
      it('2', () => {
        expect(1).toBe(1);
      });
    });
  })
})