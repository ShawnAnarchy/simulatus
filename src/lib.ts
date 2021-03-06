import * as Random from './random'
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
  sampleM,
  samplePeople
} from './util'

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
  PARTICIPATION_THRESHOLD,
  BOTTLENECK_THRESHOLD,
  TUNING,
  DELIBERATION_HEADCOUNT,
  MIXING_TERM } from './const'



export type ValidationResult = {
  code: string,
  report: string
}
interface ClockInterface {
  tick(): void;
  validate(): ValidationResult;
}
export enum StateMachineError {
  FACILITATOR_DUPLICATION = 'FACILITATOR_DUPLICATION',
  FACILITATOR_OVERFLOW = 'FACILITATOR_OVERFLOW',
  OK = 'OK'
}

export class StateMachine implements ClockInterface {
  tickCount: number;
  people: Map<string,Citizen>;
  peopleKeys: Array<string>;
  treasury: number;
  annualRevenue: number;
  annualExpense: number;
  annualSeigniorage: number;
  annualInfrationRate: number;
  proposals: Map<string,Proposal>;
  finishedProposals: Map<string,Proposal>;
  domains: Array<string>;
  miscellaneousAdministrations: Array<Administration>;
  AofMedia: Administration;
  AofEducation: Administration;
  AofSurveillance: Administration;
  AofPolice: Administration;
  AofJurisdiction: Administration;
  AofKYC: Administration;
  AofTEEManager: Administration;
  supremeJudges: Array<SupremeJudge>;
  facilitators: Array<Facilitator>;//TODO Map<string, Facilitator>
  professionals: Map<string, Array<Professional>>;
  deadPeople: Array<Citizen>;
  summaryStore: any;
  records: Map<string, Map<string, number>>;
  debugCount: number;
  bottleneck: Map<string, number>;
  lastLapKey: string;
  lastLapValue: number;
  sampleCandidateCache: Array<number>;
  timeoutCallCount: number;
  suffrageCitizens: number;
  prepairedCitizens: number;
  inactiveKeys: Array<string>;
  addCitizenCount: number;


  constructor(){
    this.tickCount = 0;
    this.people = new Map<string,Citizen>();
    this.peopleKeys = [];
    this.treasury = 0;
    this.annualRevenue = 0;
    this.proposals = new Map<string,Proposal>();
    this.finishedProposals = new Map<string,Proposal>();
    this.domains = [];
    this.miscellaneousAdministrations = [];
    this.AofMedia = new Administration();
    this.AofEducation = new Administration();
    this.AofSurveillance = new Administration();
    this.AofPolice = new Administration();
    this.AofJurisdiction = new Administration();
    this.AofKYC = new Administration();
    this.AofTEEManager = new Administration();
    this.supremeJudges = [];
    this.facilitators = [];
    this.professionals = new Map<string,Array<Professional>>();
    this.deadPeople = [];
    this.summaryStore = {};
    this.sampleCandidateCache = new Array<number>();

    // analysis state
    this.records = new Map<string, Map<string, number>>();
    this.suffrageCitizens = 0;
    this.prepairedCitizens = 0;
    this.inactiveKeys = [];


    // debugger state
    this.debugCount = 0;
    this.bottleneck = new Map<string, number>();
    this.lastLapKey = "";
    this.lastLapValue = 0;
    this.timeoutCallCount = 0;
    this.addCitizenCount = 0;
  }
  lap(label){
    if(!TUNING) return;
    let value = Date.now();
    let key = `${this.debugCount}_${label}-${this.lastLapKey}`;

    let diff = 0;
    if(this.lastLapValue > 0){
      diff = value - this.lastLapValue;
    }

    if(diff > BOTTLENECK_THRESHOLD){
      this.bottleneck[key] = diff;
    }  
    this.debugCount++;
    this.lastLapKey = label;
    this.lastLapValue = value;
  }
  tickReport(i){
    let s = state.get();
    let fr = s.summaryStore.freeRatio;
    let pt = PARTICIPATION_THRESHOLD;
    let pprps = lengthM(s.proposals);
    let oprps = s.summaryStore.ongoingProposals;
    let aprps = lengthM(filterM(s.finishedProposals, (k,v)=> v.isApproved ));
    let dprps = lengthM(s.finishedProposals) - aprps;
    let bt = s.summaryStore.bottleneck;
    console.log(`day${i/2}:${fr}%/${pt}%  ${pprps}pprps ${oprps}oprps ${aprps}aprps ${dprps}dprps ${bt}bt`) 
  }

  payTax(amount){
    this.treasury += amount;
  }
  withdrawWelfare(amount){
    this.treasury -= amount;
  }
  addDomain(name:string){
    this.domains.push(name);
    this.professionals[name] = [];
  }
  addCitizen(): Citizen {
    let citizen = new Citizen();
    this.people[citizen.id] = citizen
    this.peopleKeys.push(citizen.id);
    citizen.index = this.addCitizenCount;
    this.addCitizenCount++;
    return citizen;
  }
  removeCitizen(citizen){
    let s = state.get();
    this.deadPeople.push(this.people[citizen.id]);
    this.people[citizen.id].status = PersonalStatus.INACTIVE;
    s.prepairedCitizens--;
  }
  addSupremeJudge(judge){
    if (judge.status === PersonalStatus.INACTIVE) throw new Error('SupremeJudge must join the mixing.');
    if (judge.status === PersonalStatus.POOLED) throw new Error('Corruption Resistant Officers cannot be a SupremeJudge.');
    if (judge.status === PersonalStatus.DELIBERATING) throw new Error('You cannot be a SupremeJudge while you are in a deliberation.');
    if (judge.age < 16) throw new Error('Too young to be a CRO.');
    judge.status = PersonalStatus.POOLED;
    if (this.supremeJudges.includes(judge)) {
      this.updateCRO(judge);
    } else {
      this.supremeJudges.push(judge);
      this.updateCitizen(judge);
    }
  }
  addFacilitator(facilitator){
    if (facilitator.status === PersonalStatus.POOLED) throw new Error('Corruption Resistant Officers cannot be a facilitator.');
    if (facilitator.status === PersonalStatus.DELIBERATING) throw new Error('You cannot be a facilitator while you are in a deliberation.');
    if (facilitator.age < 16) throw new Error('Too young to be a CRO.');
    if (this.facilitators.length > FACILITATORS_INITIAL_HEADCCOUNT) throw new Error('FACILITATOR is too much.');

    facilitator.status = PersonalStatus.POOLED;
    this.prepairedCitizens--;
    if (this.facilitators.includes(facilitator)) {
      this.updateCRO(facilitator);
    } else {
      this.facilitators.push(facilitator);
      this.updateCitizen(facilitator);
    }
  }
  addProfessional(domain, professional){
    if (professional.status === PersonalStatus.INACTIVE) throw new Error('Professional must join the mixing.');
    if (professional.status === PersonalStatus.POOLED) throw new Error('Corruption Resistant Officers cannot be a professional.');
    if (professional.status === PersonalStatus.DELIBERATING) throw new Error('You cannot be a professional while you are in a deliberation.');
    if (professional.age < 16) throw new Error('Too young to be a CRO.');
    professional.status = PersonalStatus.POOLED;
    this.prepairedCitizens--;
    if (this.professionals[domain].includes(professional)) {
      this.updateCRO(professional);
    } else {
      this.professionals[domain].push(professional);
      this.updateCitizen(professional);
    }
  }
  sampleCandidate(){
    let now = Date.now();
    let len = POPULATION - 1;
    let rand = Random.number(0, len);
    while( this.sampleCandidateCache.includes(rand) ){
      if(this.sampleCandidateCache.length > len) throw 'Too many while loops.';
      rand = Random.number(0, len);
    }
    this.sampleCandidateCache.push(rand);
    let now_sbf = Date.now();
    let candidate = samplePeople(rand);
    let now_saf = Date.now();
    if(!candidate) throw new Error(`Why there's empty citizen?`);
    return candidate;
  }
  
  tick(){
    let now = Date.now
    this.tickCount++;
    let context = this.validate();
    this.summaryStore = this.summary();

    if( !context.code ) throw new Error(`DAO4N Error: Assumption viorated. ${context.report}`)
    if( context.code === StateMachineError.FACILITATOR_DUPLICATION ) throw new Error(`FACILITATOR is inconsistently duplicated.`)
    if( context.code === StateMachineError.FACILITATOR_OVERFLOW ) throw new Error(`FACILITATOR is too much.`)

    
    let availableRatio = (this.summaryStore.freeRatio-PARTICIPATION_THRESHOLD)/100;
    availableRatio > 0 ? availableRatio : 0;
    let proposalInTick = Math.ceil(
      (this.summaryStore.population_ready*availableRatio)/DELIBERATION_HEADCOUNT
    );
    let proposers = this.pickCandidates(proposalInTick, PersonalStatus.CANDIDATE);
    proposers.map(v=>{
      this.timeout(now);
      v.submitProposal();
    });
    if(this.tickCount%(MIXING_TERM*2)===0) {
      this.inactiveKeys.map(key=>{
        let v: Citizen = this.people[key];
        v.masquerade();
      })
    }

    this.proposals = filterM(this.proposals, (k,v)=>{
      if(!v) return false;
      this.timeout(now);
      let proposal = v.tick();
      let c = proposal.validate().code;
      return (c !== ProposalPhases.UNKNOWN_ERROR && c !== ProposalPhases.HEADCOUNT_UNREACHED);
    });

    this.miscellaneousAdministrations.map(a=> a.tick() )
    this.AofMedia.tick()
    this.AofEducation.tick()
    this.AofSurveillance.tick()
    this.AofPolice.tick()
    this.AofJurisdiction.tick()
    this.AofKYC.tick()
    this.AofTEEManager.tick()
    this.supremeJudges.map(a=> a.tick() )
    this.facilitators.map(a=> a.tick() )
    this.domains.map(d=>{
      this.professionals[d].map(a=> a.tick() )
    })

    this.timeout(now);
  }
  timeout(now){
    let diff = Date.now() - now;
    this.timeoutCallCount++;
    if(diff > 60000) throw new Error(`This tick took long. diff=${diff} count=${this.timeoutCallCount}`);
  }
  validate(){
    // TODO check CROs' max headcount
    // TODO check budget exceeding
    // TODO check deregistration rate

    if(this.facilitators.length !== uniq(this.facilitators).length){
      return {
        code: StateMachineError.FACILITATOR_DUPLICATION,
        report: ""
      }
    } else if(this.facilitators.length > FACILITATORS_INITIAL_HEADCCOUNT){
      return {
        code: StateMachineError.FACILITATOR_OVERFLOW,
        report: ""
      }
    } else {
      return {
        code: StateMachineError.OK,
        report: ""
      }
    }

  }
  submitProposal(proposer, problemType): Proposal{
    let proposal = new Proposal(proposer, problemType);
    this.proposals[proposal.id] = proposal;
    return proposal;
  }
  approveProposal(proposal){
    this.miscellaneousAdministrations.push(proposal.administrationToBeCreated)
    this.miscellaneousAdministrations = this.miscellaneousAdministrations
    proposal.isApproved = true;
    this.updateProposal(proposal);
    //TODO: Reward for participants
    //TODO: There's no tie between admin and vestedMonthlyBudget
  }
  updateProposal(proposal){
    this.proposals[proposal.id] = proposal;
  }
  updateProposalWithParticipants(proposal){
    this.updateProposal(proposal);
    this.updateCitizen(proposal.proposer);
    proposal.representatives.map(r=> this.updateCRO(r) );
    proposal.professionals.map(p=> this.updateCRO(p) );
    if(proposal.facilitator) this.updateCRO(proposal.facilitator);
  }
  updateCitizen(citizen){
    if(!citizen) throw new Error('citizen is null');
    this.people[citizen.id] = citizen;
  }
  updateCRO(cro){
    if(!cro) throw new Error('cro is null');
    let s = state.get();

    this.facilitators = this.facilitators.map(p=> (p.id === cro.id) ? cro : p );
    for(var j=0; j<s.domains.length; j++){
      if(this.professionals[s.domains[j]].length > 0){
        this.professionals[s.domains[j]] = this.professionals[s.domains[j]]
          .map(p=> (p.id === cro.id) ? cro : p );
      } else {
        this.professionals[s.domains[j]].push(cro);
      }
    }
    if(this.supremeJudges.length > 0){
      this.supremeJudges = this.supremeJudges.map(p=> (p.id === cro.id) ? cro : p );
    } else {
      this.supremeJudges.push(cro);
    }

    this.updateCitizen(cro);
  }
  appendRecord(dest:string, key:string, value:number):void {
    if(!this.records[dest]) this.records[dest] = {}
    this.records[dest][key] = value;
  }
  summary(){
    let s = state.get();

    let population_suffrage = this.suffrageCitizens;
    let population_ready = this.prepairedCitizens;
    let ongoingProposals = lengthM(filterM(s.proposals, (k,v)=>{
      if(!v) return false;
      let c = v.validate().code;
      return c === ProposalPhases.DELIBERATION
      || c === ProposalPhases.DOMAIN_ASSIGNMENT
      || c === ProposalPhases.PROFESSIONAL_ASSIGNMENT
      || c === ProposalPhases.FINAL_JUDGE
    }))
    let population_in_deliberation = ongoingProposals*(DELIBERATION_HEADCOUNT);
    return {
      freeRatio: Math.ceil((population_ready/population_suffrage)*1000000)/10000,
      population_suffrage: population_suffrage,
      population_ready: population_ready,
      population_in_deliberation: population_in_deliberation,
      ongoingProposals: ongoingProposals,
      bottleneck: stringify(s.bottleneck)
    }
  }
  pickCandidates(n, nextPersonalState:PersonalStatus, isCRO=false):Array<Citizen>{
    let candidates = [];
    let cache = [];
    let now = Date.now();
    while( candidates.length < n && this.sampleCandidateCache.length < POPULATION ){
      if(cache.length >= 3 * (n + this.summaryStore.population_in_deliberation ) ) break;
      let candidate = this.sampleCandidate();
      if( !cache.includes(candidate.id) && candidate.isCandidate() ) {
        candidate.status = nextPersonalState;
        isCRO ? this.updateCRO(candidate) : this.updateCitizen(candidate);
        candidates.push(candidate);
      }
      cache.push(candidate.id);
    }
    let s = state.get();
    return candidates;
  }

}
export let state = (() => {
  var instance: StateMachine;

  function createInstance():StateMachine {
    var object: StateMachine = new StateMachine();
    return object;
  }

  function _get(){
    if (!instance) {
      instance = createInstance();
    }
    return instance;
  }

  return {
    get: ()=>{
      return _get();
    },
    set: _state=>{
      instance = _state
    },
    init: ()=>{
      instance = createInstance();
      return instance;
    },
    setup: (population:number)=>{
      let s = _get();
      for(var i=1; i<=population; i++){
        let citizen = s.addCitizen();
        citizen.status = PersonalStatus.CANDIDATE;
        if( citizen.isSuffrage() ) s.suffrageCitizens++;
        if( citizen.isCandidate() ) s.prepairedCitizens++;
        if(i%(10**(`${POPULATION}`.length-2)) === 0) console.log(`${i}citizens created!`);
      }
      console.log('citizen created.');
      s.summaryStore = s.summary();

      DEFAULT_DOMAINS.map(d=>s.addDomain(d));
      console.log('domain created.');

      // Snapshot.save(0);
      let facilitators = s.pickCandidates(
        FACILITATORS_INITIAL_HEADCCOUNT,
        PersonalStatus.CANDIDATE,
        true
      );
      if(facilitators.length < FACILITATORS_INITIAL_HEADCCOUNT) throw new Error("Facilitator isn't created.");
      facilitators.map(v=>{
        s.addFacilitator(new Facilitator(v));
      })
      console.log(`Facilitators created: ${facilitators.length}`)

      let judges = s.pickCandidates(
        SUPREME_JUDGES_INITIAL_HEADCCOUNT,
        PersonalStatus.CANDIDATE,
        true
      )
      if(judges.length < SUPREME_JUDGES_INITIAL_HEADCCOUNT) throw new Error("Judge isn't created.");
      judges.map(v=>{
        s.addSupremeJudge(new SupremeJudge(v));
      });
      console.log(`Judges created: ${judges.length}`)

      for(var j=0; j<s.domains.length; j++){
        let profs = s.pickCandidates(
          PROFESSIONALS_INITIAL_HEADCCOUNT_PER_DOMAIN,
          PersonalStatus.CANDIDATE,
          true
        );
        if(profs.length < PROFESSIONALS_INITIAL_HEADCCOUNT_PER_DOMAIN) throw new Error("Profs isn't created.");
        profs.map(v=>{
          s.addProfessional(s.domains[j], new Professional(v));
        })
        console.log(`Profs for ${s.domains[j]} created: ${profs.length}`)
      }

      return s;
    }
    
  }
})();


export const enum ProblemTypes {
  ASSIGNMENT = 'a',
  DISMISSAL = 'd',
  NORMAL = 'n',
  HEAVY = 'h',
  VARIABLE_UPDATE = 'vu'
}
export const enum ProposalPhases {
  INITIAL_JUDGE = 'INITIAL_JUDGE',
  FACILITATOR_ASSIGNMENT = 'FACILITATOR_ASSIGNMENT',
  DOMAIN_ASSIGNMENT = 'DOMAIN_ASSIGNMENT',
  PROFESSIONAL_ASSIGNMENT = 'PROFESSIONAL_ASSIGNMENT',
  DELIBERATION = 'DELIBERATION',
  FINAL_JUDGE = 'FINAL_JUDGE',
  FINISHED = 'FINISHED',
  HEADCOUNT_EXCEEDED = 'HEADCOUNT_EXCEEDED',
  HEADCOUNT_UNREACHED = 'HEADCOUNT_UNREACHED',
  UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export class Proposal implements ClockInterface {
  s: StateMachine;
  id: string;
  proposer: Citizen;
  facilitator?: Citizen;
  professionals: Array<Citizen>;
  domains: Array<string>
  problemType: ProblemTypes;
  durationDays:number;
  spentDays:number;
  representatives: Array<Citizen>;
  progressismDegree: number;
  humanrightsDegree: number;
  administrationToBeCreated: Administration;
  vestedMonthlyBudget: number;
  isFinished: boolean;
  isApproved: boolean;

  constructor(proposer, problemType){
    let s = state.get();
    s.lap('cnstPrp_a');
    if(proposer.status === PersonalStatus.INACTIVE) throw new Error('Proposer must join the mixing.');
    if(proposer.status === PersonalStatus.POOLED) throw new Error('Corruption Resistant Officers cannot be a proposer.');
    if(proposer.status === PersonalStatus.DELIBERATING) throw new Error('You cannot propose while you are in a deliberation.');
    if(proposer.age < 16) throw new Error('Too young to be a proposer');
    s.lap('cnstPrp_b');

    this.id = Random.uuid(40);
    this.problemType = problemType;
    this.proposer = this.assignProposer(proposer);
    this.facilitator = null;
    this.domains = [];
    this.professionals = [];
    this.durationDays = this.getDurationDays();
    this.spentDays = 0;
    this.representatives = [];
    s.lap('cnstPrp_c');
    this.pickRepresentatives();
    s.lap('cnstPrp_d');
    this.progressismDegree = 30 + Random.number(0, 60)
    this.humanrightsDegree = 30 + Random.number(0, 60)
    this.administrationToBeCreated = new Administration()
    this.vestedMonthlyBudget = this.administrationToBeCreated.monthlyBudget
    this.isFinished = false;
    this.isApproved= false;
    s.lap('cnstPrp_e');

    state.get().updateCitizen(proposer);
    s.lap('cnstPrp_f');
  }
  getDurationDays(){
    switch (this.problemType) {
      case ProblemTypes.ASSIGNMENT:
        return 7;
      case ProblemTypes.DISMISSAL:
        return 3;
      case ProblemTypes.NORMAL:
        return 14;
      case ProblemTypes.HEAVY:
        return 60;
      case ProblemTypes.VARIABLE_UPDATE:
        return 30;
      }
  }
  finishProposal(){
    let s = state.get();
    this.isFinished = true;
    this.proposer.status = PersonalStatus.INACTIVE;
    s.inactiveKeys.push(this.proposer.id);

    s.lap('fnsh_a');
    this.representatives = this.representatives.map(r=>{
      r.status = PersonalStatus.INACTIVE;
      s.inactiveKeys.push(r.id);
      return r;
    });
    s.lap('fnsh_b');
    if(this.facilitator) {
      this.facilitator.status = PersonalStatus.POOLED;
    }
    s.lap('fnsh_c');
    this.professionals = squash(this.professionals).map(p=>{
      p.status = PersonalStatus.POOLED;
      return p;
    });
    s.lap('fnsh_d');
    s.updateProposalWithParticipants(this);
    s.finishedProposals[this.id] = this;
    delete s.proposals[this.id];
  }

  tick():Proposal{
    let s = state.get();
    let context = this.validate()
    let now = Date.now();
    switch(context.code){
      case ProposalPhases.INITIAL_JUDGE:
        if(this.proposer.intelligenceDeviation > 50){
          // just tick if proposal is pseudo-reasonable
        } else {
          this.finishProposal()
          s.lap('prp_finishProposal_first');
        }
        break;
      case ProposalPhases.FACILITATOR_ASSIGNMENT:
        this.pickFacilitator();
        s.lap('prp_pickFacilitator');
        break;
      case ProposalPhases.DOMAIN_ASSIGNMENT:
        this.pickDomains()
        s.lap('prp_pickDomains');
        break;
      case ProposalPhases.PROFESSIONAL_ASSIGNMENT:
        this.pickProfessionals()
        s.lap('prp_pickProfessionals');
        break;
      case ProposalPhases.DELIBERATION:
        if(!this.isFinished){
          let teachers = squash([this.facilitator].concat(this.professionals))
          let avgTeacherintelligenceDeviation = teachers.map(t=> t.intelligenceDeviation ).reduce((s,i)=> s+i ,0)/teachers.length
          let dailyEffect = (avgTeacherintelligenceDeviation - 50)/this.durationDays
          this.representatives = this.representatives.map(r=> r.affectByDeliberation(dailyEffect) )
          this.modificationRequests();
          s.lap('prp_DELIBERATION');
          // s.lap('prp_modificationRequests');
        }
        break;
      case ProposalPhases.FINAL_JUDGE:
        let forCount = this.quorum();
        if(forCount > this.representatives.length/2){
          state.get().approveProposal(this);
          s.lap('prp_approveProposal');
          this.finishProposal();
          s.lap('prp_apfinishProposal1');
        } else {
          this.finishProposal();
          s.lap('prp_nonapfinishProposal2');
        }
        break;
      case ProposalPhases.FINISHED:
        if(!this.isFinished) this.finishProposal();
        break;
      case ProposalPhases.HEADCOUNT_EXCEEDED:
      case ProposalPhases.HEADCOUNT_UNREACHED:
      case ProposalPhases.UNKNOWN_ERROR:
        break;
    }
    // console.log(`${s.tickCount}:${context.code} ${s.summaryStore.freeRatio}% ${POPULATION}ppl ${lengthM(s.proposals)}prps ${s.summaryStore.ongoingProposals}oprps ${this.spentDays}sptdys ${this.representatives.length}reps fin?:${this.isFinished}`);

    this.spentDays += TICKING_TIME
    return this;
  }
  validate(){
    if(this.spentDays === 0 && this.representatives.length === REPRESENTATIVE_HEADCOUNT && !this.isFinished) {
      return { code: ProposalPhases.INITIAL_JUDGE, report: "" }
    } else if(0 < this.spentDays && this.representatives.length  === REPRESENTATIVE_HEADCOUNT && !this.facilitator && this.spentDays < this.durationDays && !this.isFinished) {
      return { code: ProposalPhases.FACILITATOR_ASSIGNMENT, report: "" }
    } else if(this.representatives.length === REPRESENTATIVE_HEADCOUNT && !!this.facilitator && this.domains.length === 0 && this.spentDays < this.durationDays && !this.isFinished) {
      return { code: ProposalPhases.DOMAIN_ASSIGNMENT, report: "" }
    } else if(this.representatives.length === REPRESENTATIVE_HEADCOUNT && !!this.facilitator && this.domains.length > 0 && this.professionals.length === 0 && this.spentDays < this.durationDays && !this.isFinished) {
      return { code: ProposalPhases.PROFESSIONAL_ASSIGNMENT, report: "" }
    } else if(this.representatives.length === REPRESENTATIVE_HEADCOUNT && !!this.facilitator && this.domains.length > 0 && this.professionals.length > 0 && this.spentDays < this.durationDays && !this.isFinished) {
      return { code: ProposalPhases.DELIBERATION, report: "" }  
    } else if(this.representatives.length === REPRESENTATIVE_HEADCOUNT && !!this.facilitator && this.domains.length > 0 && this.professionals.length > 0 && this.spentDays >= this.durationDays && !this.isFinished) {
      return { code: ProposalPhases.FINAL_JUDGE, report: "" }
    } else if(this.spentDays >= this.durationDays || this.isFinished) {
      return { code: ProposalPhases.FINISHED, report: `` }  
    } else if(this.representatives.length > REPRESENTATIVE_HEADCOUNT) {
      return {
        code: ProposalPhases.HEADCOUNT_EXCEEDED,
        report: `this.representatives.length=${this.representatives.length} and REPRESENTATIVE_HEADCOUNT=${REPRESENTATIVE_HEADCOUNT}`
      }  
    } else if(this.representatives.length < REPRESENTATIVE_HEADCOUNT) {
      return {
        code: ProposalPhases.HEADCOUNT_UNREACHED,
        report: `this.representatives.length=${this.representatives.length} and REPRESENTATIVE_HEADCOUNT=${REPRESENTATIVE_HEADCOUNT}`
      }  
    } else {
      return {
        code: ProposalPhases.UNKNOWN_ERROR,
        report: `Proposal.validate(): Unknown error.`
      }  
  
    }
  }
  assignProposer(proposer){
    let s = state.get();
    proposer.status = PersonalStatus.DELIBERATING;
    s.prepairedCitizens--;
    state.get().updateCitizen(proposer);
    return proposer;
  }
  pickFacilitator(){
    let s = state.get();
    let candidates = s.facilitators.filter(f=> f.status === PersonalStatus.POOLED && f.age >= 16 )
    if(candidates.length > 0){
      let randIndex = Random.number(0, candidates.length-1)
      let selectedFacilitator = candidates[randIndex]
      selectedFacilitator.status = PersonalStatus.DELIBERATING;
      this.facilitator = selectedFacilitator
      s.updateCRO(selectedFacilitator);//citizen=busy,cro=busy
    } else {
      this.finishProposal();
    }
  }
  pickRepresentatives(){
    let s = state.get();
    let reps = s.pickCandidates(REPRESENTATIVE_HEADCOUNT, PersonalStatus.DELIBERATING);
    if(reps.length < REPRESENTATIVE_HEADCOUNT) {
      this.representatives = [];
      this.finishProposal();
    } else {
      this.representatives = reps;
      s.prepairedCitizens -= REPRESENTATIVE_HEADCOUNT;
    }
    
  }
  pickDomains(){
    let s = state.get();
    let rand = Random.number(0, s.domains.length-1);
    let shuffledDomains = shuffle(s.domains);
    this.domains = [...Array(rand)]
      .map((x,i)=> shuffledDomains[i] );      
  }
  pickProfessionals(){
    this.professionals = this.domains.map(d=>{
      let candidates = state.get().professionals[d].filter(p=> p.status === PersonalStatus.POOLED )
      if(candidates.length === 0) return;
      let randIndex = Random.number(0, candidates.length-1)
      let selectedProfessional = candidates[randIndex]
      selectedProfessional.status = PersonalStatus.DELIBERATING;
      state.get().updateCRO(selectedProfessional);
      return selectedProfessional;
    })
    
  }
  modificationRequests(){
    this.progressismDegree += Random.number(0, 7) - Random.number(0, 5)
    this.humanrightsDegree += Random.number(0, 7) - Random.number(0, 5)
  }
  quorum(){
    return this.representatives.filter(r=>{
      let res = false;
      // if( r.humanrightsPreference < 50
      //         && r.progressismPreference > this.progressismDegree ) {
      //   res = true
      // } else if ( r.progressismPreference > this.progressismDegree
      //                 && r.humanrightsPreference > this.humanrightsDegree ) {
      //   res = true
      // }
      res = true;//Random.number(0,1)===0;
      return res;
    }).length;
  }
}

export enum LifeStage {
  SUFFRAGE = 's',
  WORKFORCE = 'w',
  NURSING = 'n',
  DEATH = 'd',
  OTHER = 'o'
}
export enum PersonalStatus {
  INACTIVE = 'inactive',
  CANDIDATE = 'candidate',
  POOLED = 'pooled',
  DELIBERATING = 'deliberating'
}
export class Citizen implements ClockInterface {
  id: string;
  index: number;
  annualSalary: number;
  intelligenceDeviation: number;
  conspiracyPreference: number;
  cultPreference: number;
  isSocioPath: boolean;
  isTakingCareForThe7thOffsprings: boolean; 
  progressismPreference: number;
  humanrightsPreference: number;
  age: number;
  biologicallyCanBePregnant: boolean; 
  lifetime: number;
  status: PersonalStatus;

  constructor(){
    this.id = Random.uuid(40)
    this.annualSalary = 0;
    this.intelligenceDeviation = 30 + Random.number(0, 60);
    this.conspiracyPreference = 100 - this.intelligenceDeviation + Random.number(0, 10) - Random.number(0, 10);
    this.cultPreference = 100 - this.intelligenceDeviation + Random.number(0, 10) - Random.number(0, 10);
    this.isSocioPath = !!(Random.number(0, 1) & Random.number(0, 1) & Random.number(0, 1) & Random.number(0, 1) );
    this.isTakingCareForThe7thOffsprings = !!(Random.number(0, 1) & Random.number(0, 1) & Random.number(0, 1) & Random.number(0, 1) );
    this.progressismPreference = 50*((this.intelligenceDeviation*this.conspiracyPreference*this.cultPreference)/(50*50*50))^(1/3);
    this.humanrightsPreference = (this.isSocioPath) ? 30 :
      (this.isTakingCareForThe7thOffsprings) ? 70 :
      (this.progressismPreference > 60) ? 40 :
      (this.progressismPreference > 50) ? 50 :
      (this.progressismPreference > 40) ? 60 : 70;
    this.biologicallyCanBePregnant = !!Random.number(0, 1)
    let lifetimeRand = Random.number(65, 85) + Random.number(0, 35) - Random.number(0, 65);
    this.lifetime = lifetimeRand > 48 ? lifetimeRand : Random.number(0,1) ? lifetimeRand : 48;
    this.age = Random.number(5, this.lifetime*0.7);
    this.status = PersonalStatus.INACTIVE;
  }
  masquerade(){
    let s = state.get();
    if( this.isSuffrage() && this.status === PersonalStatus.INACTIVE ){
      let randIndex = s.sampleCandidateCache.indexOf(this.index);
      if(randIndex >= 0) s.sampleCandidateCache.splice(randIndex, 1);
      s.prepairedCitizens++;
      this.status = PersonalStatus.CANDIDATE;
    }
    return this;
  }
  isSuffrage(){
    let code = this.validate().code;
    return code === LifeStage.SUFFRAGE || code === LifeStage.WORKFORCE;
  }
  isCandidate(){
    return (this.status === PersonalStatus.CANDIDATE && this.isSuffrage() );
  }

  tick():Citizen{
    let s = state.get();
    let context = this.validate();


    s.lap('ppl_removeCitizen_bf');
    if(context.code === LifeStage.DEATH){
      state.get().removeCitizen(this)
    }
    s.lap('ppl_removeCitizen_af');

    this.earn(context)
    this.payTax(context)
    this.getWelfare(context)
    this.passivePoliticalAction(context)
    s.lap('ppl_activePoliticalAction');

    this.age += TICKING_TIME/365
    this.validateAfter();
    s.lap('ppl_g');
    return this;
  }
  validate(){
    if (this.age > this.lifetime) {
      return { code: LifeStage.DEATH, report: "" }
    } else if (this.age < 16 || 75 < this.age) {
      return { code: LifeStage.NURSING, report: "" }
    } else if (22 <= this.age && this.age <= 75) {
      return { code: LifeStage.WORKFORCE, report: "" }
    } else if (16 <= this.age) {
      return { code: LifeStage.SUFFRAGE, report: "" }
    } else {
      return { code: LifeStage.OTHER, report: "" }
    }
  }
  validateAfter(){
    if(this.intelligenceDeviation < LOWERBOUND) this.intelligenceDeviation = LOWERBOUND;
    if(this.conspiracyPreference < LOWERBOUND) this.conspiracyPreference = LOWERBOUND;
    if(this.cultPreference < LOWERBOUND) this.cultPreference = LOWERBOUND;
    if(this.progressismPreference < LOWERBOUND) this.progressismPreference = LOWERBOUND;
    if(this.humanrightsPreference < LOWERBOUND) this.humanrightsPreference = LOWERBOUND;

    if(UPPERBOUND < this.intelligenceDeviation) this.intelligenceDeviation = UPPERBOUND;
    if(UPPERBOUND < this.conspiracyPreference) this.conspiracyPreference = UPPERBOUND;
    if(UPPERBOUND < this.cultPreference) this.cultPreference = UPPERBOUND;
    if(UPPERBOUND < this.progressismPreference) this.progressismPreference = UPPERBOUND;
    if(UPPERBOUND < this.humanrightsPreference) this.humanrightsPreference = UPPERBOUND;
  }
  earn(context){
    switch(context.code){
      case LifeStage.SUFFRAGE:
        this.annualSalary = -1500*12
        break;
      case LifeStage.WORKFORCE:
        if (this.annualSalary < 2000*12) {
          this.annualSalary = 2000*12 + Random.number(0, 1000*12)
        } else if (65 < this.age) {
          this.annualSalary = 3000*12 + Random.number(0, 2000*12) - Random.number(0, 2000*12)
        } else if (50 < this.age) {
          this.annualSalary = 5000*12 + Random.number(0, 5000*12) - Random.number(0, 1000*12)
        } else if (46 < this.age) {
          this.annualSalary = 5000*12 + Random.number(0, 4000*12) - Random.number(0, 2000*12)
        } else if (32 < this.age) {
          this.annualSalary = 4000*12 + Random.number(0, 4000*12) - Random.number(0, 1500*12)
        } else if (28 < this.age) {
          this.annualSalary = 3000*12 + Random.number(0, 2000*12) - Random.number(0, 1000*12)
        }
        break;
      case LifeStage.NURSING:
        this.annualSalary = -1000*12
        break;
      case LifeStage.DEATH:
        this.annualSalary = 0
        break;
    }
  }
  payTax(context){
    let taxRate;
    switch(context.code){
      case LifeStage.SUFFRAGE:
        taxRate = 0;
        break;
      case LifeStage.WORKFORCE:
        if (this.annualSalary < 2000*12) {
          taxRate = 0.1;
        } else if (2000*12 <= this.annualSalary && this.annualSalary < 3000*12) {
          taxRate = 0.13;
        } else if (3000*12 <= this.annualSalary && this.annualSalary < 4000*12) {
          taxRate = 0.15;
        } else if (4000*12 <= this.annualSalary && this.annualSalary < 5000*12) {
          taxRate = 0.17;
        } else if (5000*12 <= this.annualSalary && this.annualSalary < 6000*12) {
          taxRate = 0.19;
        } else if (6000*12 <= this.annualSalary && this.annualSalary < 7000*12) {
          taxRate = 0.21;
        } else if (7000*12 <= this.annualSalary && this.annualSalary < 8000*12) {
          taxRate = 0.23;
        } else if (8000*12 <= this.annualSalary && this.annualSalary < 9000*12) {
          taxRate = 0.25;
        } else if (9000*12 <= this.annualSalary && this.annualSalary < 10000*12) {
          taxRate = 0.27;
        } else {
          taxRate = 0.38;
        }
        break;
      case LifeStage.NURSING:
        taxRate = 0;
        break;
      case LifeStage.DEATH:
        taxRate = 0;
        break;
    }
    this.annualSalary = this.annualSalary*(1-taxRate)
    state.get().payTax(this.annualSalary*taxRate)
  }
  getWelfare(context){
    let welfareAmount;
    switch(context.code){
      case LifeStage.SUFFRAGE:
        welfareAmount = 1000*12
        break;
      case LifeStage.WORKFORCE:
        welfareAmount = 100*12
        break;
      case LifeStage.NURSING:
        welfareAmount = 2000*12
        break;
        case LifeStage.DEATH:
        welfareAmount = 0
        break;
    }
    this.annualSalary = this.annualSalary + welfareAmount
    state.get().withdrawWelfare(welfareAmount)
  }
  submitProposal(){
    let s = state.get();
    s.lap('ctznSubPrp_a');
    if(s.summaryStore.freeRatio > PARTICIPATION_THRESHOLD){
      let problemType = [
        ProblemTypes.NORMAL,
        ProblemTypes.ASSIGNMENT,
        ProblemTypes.DISMISSAL,
        ProblemTypes.VARIABLE_UPDATE,
        ProblemTypes.HEAVY
      ][Random.number(0, 4)];
      s.submitProposal(this, problemType);
      this.status = PersonalStatus.DELIBERATING;
    }
    s.lap('ctznSubPrp_b');
  }
  passivePoliticalAction(context){
    // skip: passive action is automatic in the simulator
  }
  affectByDeliberation(point):Citizen{
    this.intelligenceDeviation += point
    this.conspiracyPreference -= point
    this.cultPreference -= point
    this.isSocioPath = false
    this.progressismPreference = 50*((this.intelligenceDeviation*this.conspiracyPreference*this.cultPreference)/(50*50*50))^(1/3);
    this.humanrightsPreference += point
    return this
  }
}
class CorruptionResistantOfficer extends Citizen {
  constructor(candidate: Citizen){
    super();
    let s = state.get();

    this.status = candidate.status;
    this.id = candidate.id
    this.annualSalary = candidate.annualSalary
    this.intelligenceDeviation = candidate.intelligenceDeviation
    this.conspiracyPreference = candidate.conspiracyPreference
    this.cultPreference = candidate.cultPreference
    this.isSocioPath = candidate.isSocioPath
    this.progressismPreference = candidate.progressismPreference
    this.humanrightsPreference = candidate.humanrightsPreference
    this.biologicallyCanBePregnant = candidate.biologicallyCanBePregnant
    this.lifetime = candidate.lifetime
    this.age = candidate.age
  }
}
export class SupremeJudge extends CorruptionResistantOfficer {
}
export class Facilitator extends CorruptionResistantOfficer {
}
export class Professional extends CorruptionResistantOfficer {
}


export class Administration implements ClockInterface {
  id: string;
  monthlyBudget: number;
  curruption: number;
  headCount: number;

  constructor(){
    this.id = Random.uuid(40);
    this.headCount = 8 + Random.number(0, 6);
    this.monthlyBudget = [...Array(this.headCount)]
      .map(_=> 3000 + Random.number(0, 2000) )
      .reduce((sum, el) => sum + el, 0);
    this.curruption = Random.number(0, 30);
  }

  tick(){
    this.curruption += Random.number(0, 3)/10
  }
  validate(){
    return {code:"",report:""}
  }

}

export class Snapshot {
  static save(tick:number){
    let s = state.get();
    let summary = s.summaryStore;

    s.appendRecord('population', `hd${tick}`, POPULATION);
    s.appendRecord('population_in_deliberation', `hd${tick}`, summary.population_in_deliberation);
    s.appendRecord('population_ready', `hd${tick}`, summary.population_ready);
    s.appendRecord('num_facilitator', `hd${tick}`, s.facilitators.length);

    let profs = s.professionals[s.domains[0]];
    s.appendRecord(`num_professional_${s.domains[0]}`, `hd${tick}`, profs ? profs.length : 0);
    s.appendRecord(`num_supremeJudge`, `hd${tick}`, s.supremeJudges.length);
    s.appendRecord(`num_proposals`, `hd${tick}`, lengthM(s.proposals));
    s.appendRecord('population_suffrage', `hd${tick}`, summary.population_suffrage);
    s.appendRecord(`freeRatio`, `hd${tick}`, summary.freeRatio);
    s.appendRecord(`num_proposalOngoing`, `hd${tick}`, summary.ongoingProposals);
    s.appendRecord(`num_proposalApproved`, `hd${tick}`, lengthM(filterM(s.finishedProposals, (k,v)=>v.isApproved)));
    s.appendRecord('num_facilitator_in_deliberation', `hd${tick}`, s.facilitators.filter(p=>p.status === PersonalStatus.DELIBERATING).length);
    s.appendRecord(`num_supremeJudge_in_deliberation`, `hd${tick}`, s.supremeJudges.filter(p=>p.status === PersonalStatus.DELIBERATING).length);
  }
}