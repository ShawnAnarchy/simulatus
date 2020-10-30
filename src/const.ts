import * as config from 'config';

export const TICKING_TIME = config.get('global.tickingTime')
export const PARTICIPATION_THRESHOLD = config.get('global.participationThreshold');
export const TUNING = config.get('global.tuning');
export const BOTTLENECK_THRESHOLD = config.get('global.bottleneckThreshold');
export const POPULATION = config.get('nation.population');
export const DEFAULT_DOMAINS = config.get('nation.domains');
export const SIMULATE_FOR_DAYS = config.get('global.simulateForDays');
export const FACILITATORS_INITIAL_HEADCCOUNT = config.get('deliberation.facilitatorsInitialHeadcount');
export const PROFESSIONALS_INITIAL_HEADCCOUNT_PER_DOMAIN = config.get('deliberation.professionalsInitialHeadcountPerDomain');
export const SUPREME_JUDGES_INITIAL_HEADCCOUNT = config.get('deliberation.supremeJudgesInitialHeadcount');
export const REPRESENTATIVE_HEADCOUNT = config.get('deliberation.representativeHeadcount');
export const UPPERBOUND = config.get('citizen.derivationUpperBound');
export const LOWERBOUND = config.get('citizen.derivationLowerBound');
