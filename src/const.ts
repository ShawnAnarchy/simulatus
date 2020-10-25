const config = require('config');

export const TICKING_TIME = config.get('global.tickingTime')
export const POPULATION = config.get('nation.population');
export const SIMULATE_FOR_DAYS = config.get('global.simulateForDays');
export const FACILITATORS_INITIAL_HEADCCOUNT = config.get('deliberation.facilitatorsInitialHeadcount');
export const PROFESSIONALS_INITIAL_HEADCCOUNT_PER_DOMAIN = config.get('deliberation.professionalsInitialHeadcountPerDomain');
export const SUPREME_JUDGES_INITIAL_HEADCCOUNT = config.get('deliberation.supremeJudgesInitialHeadcount');
export const UPPERBOUND = config.get('citizen.derivationUpperBound');
export const LOWERBOUND = config.get('citizen.derivationLowerBound');