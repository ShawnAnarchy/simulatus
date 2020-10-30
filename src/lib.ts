import * as Random from './random'
import {
  fetchRecord,
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
  uniqM,
  sampleM
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
  TUNING } from './const'



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
  CITIZEN_DUPLICATION = 'CITIZEN_DUPLICATION',
  FACILITATOR_OVERFLOW = 'FACILITATOR_OVERFLOW',
  OK = 'OK'
}

export class StateMachine implements ClockInterface {
  people: Map<string,Citizen>;
  treasury: number;
  annualRevenue: number;
  annualExpense: number;
  annualSeigniorage: number;
  annualInfrationRate: number;
  proposals: Map<string,Proposal>;
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


  constructor(){
    this.people = new Map<string,Citizen>();
    this.treasury = 0;
    this.annualRevenue = 0;
    this.proposals = new Map<string,Proposal>();
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

    // analysis state
    this.records = new Map<string, Map<string, number>>();

    // debugger state
    this.debugCount = 0;
    this.bottleneck = new Map<string, number>();
    this.lastLapKey = "";
    this.lastLapValue = 0;
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
    return citizen;
  }
  removeCitizen(citizen){
    delete this.people[citizen.id];
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
    if (facilitator.status === PersonalStatus.INACTIVE) throw new Error('Facilitator must join the mixing.');
    if (facilitator.status === PersonalStatus.POOLED) throw new Error('Corruption Resistant Officers cannot be a facilitator.');
    if (facilitator.status === PersonalStatus.DELIBERATING) throw new Error('You cannot be a facilitator while you are in a deliberation.');
    if (facilitator.age < 16) throw new Error('Too young to be a CRO.');
    if (this.facilitators.length > FACILITATORS_INITIAL_HEADCCOUNT) throw new Error('FACILITATOR is too much.');

    facilitator.status = PersonalStatus.POOLED;
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
    if (this.professionals[domain].includes(professional)) {
      this.updateCRO(professional);
    } else {
      this.professionals[domain].push(professional);
      this.updateCitizen(professional);
    }
  }

  tick(){
    let context = this.validate();
    if( !context.code ) throw new Error(`DAO4N Error: Assumption viorated. ${context.report}`)
    if( context.code === StateMachineError.FACILITATOR_DUPLICATION ) throw new Error(`FACILITATOR is inconsistently duplicated.`)
    if( context.code === StateMachineError.CITIZEN_DUPLICATION ) throw new Error(`CITIZEN is inconsistently duplicated.`)
    if( context.code === StateMachineError.FACILITATOR_OVERFLOW ) throw new Error(`FACILITATOR is too much.`)

    this.summaryStore = this.summary();

    // TODO tick all actors
    this.lap('sttmcn_a');
    mapM(this.people, (k,v)=> v.tick() )
    this.lap('sttmcn_b');
    mapM(this.proposals, (k,v)=> v.tick() )
    this.lap('sttmcn_c');
    this.miscellaneousAdministrations.map(a=> a.tick() )
    this.lap('sttmcn_d');
    this.AofMedia.tick()
    this.lap('sttmcn_e');
    this.AofEducation.tick()
    this.lap('sttmcn_f');
    this.AofSurveillance.tick()
    this.lap('sttmcn_g');
    this.AofPolice.tick()
    this.lap('sttmcn_h');
    this.AofJurisdiction.tick()
    this.lap('sttmcn_i');
    this.AofKYC.tick()
    this.lap('sttmcn_j');
    this.AofTEEManager.tick()
    this.lap('sttmcn_k');
    this.supremeJudges.map(a=> a.tick() )
    this.lap('sttmcn_l');
    this.facilitators.map(a=> a.tick() )
    this.lap('sttmcn_m');
    this.domains.map(d=>{
      this.professionals[d].map(a=> a.tick() )
    })
    this.lap('sttmcn_n');
    // TODO each ticks refer this https://paper.dropbox.com/doc/--A94iOUxIv4si~XPY5jFo1TMKAg-OSm6HZnzqnEz61jbe0izX


    // TODO calculate stats


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
    } else if(lengthM(this.people) !== lengthM(uniqM(this.people))){
      return {
        code: StateMachineError.CITIZEN_DUPLICATION,
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
    this.lap('updtPwP_a');
    this.updateProposal(proposal);
    this.lap('updtPwP_b');
    this.updateCitizen(proposal.proposer);
    this.lap('updtPwP_c');
    proposal.representatives.map(r=> this.updateCRO(r) );
    this.lap('updtPwP_d');
    proposal.professionals.map(p=> this.updateCRO(p) );
    this.lap('updtPwP_e');
    if(proposal.facilitator) this.updateCRO(proposal.facilitator);
    this.lap('updtPwP_f');
  }
  updateCitizen(citizen){
    if(!citizen) throw new Error('citizen is null');
    this.people[citizen.id] = citizen;
  }
  updateCRO(cro){
    if(!cro) throw new Error('cro is null');
    let s = state.get();

    this.facilitators = this.facilitators.map(p=>{
      if(p.id === cro.id){
        return cro;
      } else {
        return p;
      }
    })  
    for(var j=0; j<s.domains.length; j++){
      if(this.professionals[s.domains[j]].length > 0){
        this.professionals[s.domains[j]] = this.professionals[s.domains[j]].map(p=>{
          if(p.id === cro.id){
            return cro;
          } else {
            return p;
          }
        })
      } else {
        this.professionals[s.domains[j]].push(cro);
      }
    }
    if(this.supremeJudges.length > 0){
      this.supremeJudges = this.supremeJudges.map(p=>{
        if(p.id === cro.id){
          return cro;
        } else {
          return p;
        }
      })
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
    let population_suffrage = lengthM(filterM(s.people, (k,v)=> v && v.isSuffrage()));
    let population_ready = lengthM(filterM(s.people, (k,v)=> v && v.status === PersonalStatus.CANDIDATE));
    let ongoingProposals = lengthM(filterM(s.proposals, (k,v)=>{
      let c = v.validate().code;
      return c === ProposalPhases.DELIBERATION
      || c === ProposalPhases.DOMAIN_ASSIGNMENT
      || c === ProposalPhases.PROFESSIONAL_ASSIGNMENT
      || c === ProposalPhases.FINAL_JUDGE
    }))
    return {
      freeRatio: Math.ceil((population_ready/population_suffrage)*100),
      population_suffrage: population_suffrage,
      population_ready: population_ready,
      ongoingProposals: ongoingProposals,
      bottleneck: stringify(s.bottleneck)
    }
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
      for(var i=0; i<population; i++){
        let citizen = s.addCitizen()
        if(i%10 !== 0) citizen.masquerade();//10% non mixing
      }

      DEFAULT_DOMAINS.map(d=>s.addDomain(d))

      for(var i=0; i<FACILITATORS_INITIAL_HEADCCOUNT; i++){
        let candidates = filterM(s.people, (k,v)=> (v.status === PersonalStatus.CANDIDATE && v.age >= 16 && v.intelligenceDeviation > 49 ));
        if(lengthM(candidates) > 0){
          let candidate = sampleM(candidates)
          s.addFacilitator(new Facilitator(candidate))
        }
      }
      for(var i=0; i<SUPREME_JUDGES_INITIAL_HEADCCOUNT; i++){
        let candidates = filterM(s.people, (k,v)=> (v.status === PersonalStatus.CANDIDATE && v.age >= 16 && v.intelligenceDeviation > 60 ));
        if(lengthM(candidates) > 0){
          let candidate = sampleM(candidates)
          s.addSupremeJudge(new SupremeJudge(candidate))
        }
      }
      for(var i=0; i<PROFESSIONALS_INITIAL_HEADCCOUNT_PER_DOMAIN; i++){
        for(var j=0; j<s.domains.length; j++){
          let candidates = filterM(s.people, (k,v)=> (v.status === PersonalStatus.CANDIDATE && v.age >= 16 && v.intelligenceDeviation > 60 ));
          if(lengthM(candidates) > 0){
            let candidate = sampleM(candidates);
            s.addProfessional(s.domains[j], new Professional(candidate))
          }
        }
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
  INITIAL_JUDGE = 'i',
  FACILITATOR_ASSIGNMENT = 'fa',
  DOMAIN_ASSIGNMENT = 'da',
  PROFESSIONAL_ASSIGNMENT = 'pa',
  DELIBERATION = 'd',
  FINAL_JUDGE = 'f',
  FINISHED = 'fi',
  HEADCOUNT_EXCEEDED = 'h',
  UNKNOWN_ERROR = "ue"
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
  representativeHeadcount: number;
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
    this.representativeHeadcount = REPRESENTATIVE_HEADCOUNT;
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
        return 14;
      case ProblemTypes.DISMISSAL:
        return 3;
      case ProblemTypes.NORMAL:
        return 14;
      case ProblemTypes.HEAVY:
        return 60;
      case ProblemTypes.VARIABLE_UPDATE:
        return 14;
      }
  }
  finishProposal(){
    let s = state.get();
    this.isFinished = true;
    this.proposer.status = PersonalStatus.INACTIVE;

    s.lap('fnsh_a');
    this.representatives = this.representatives.map(r=>{
      r.status = PersonalStatus.INACTIVE;
      return r;
    });
    s.lap('fnsh_b');
    if(this.facilitator) {
      this.facilitator.status = PersonalStatus.POOLED;
    }
    s.lap('fnsh_c');
    this.professionals = this.professionals.map(p=>{
      p.status = PersonalStatus.POOLED;
      return p;
    });
    s.lap('fnsh_d');
    state.get().updateProposalWithParticipants(this);
  }

  tick():Proposal{
    let s = state.get();
    let context = this.validate()
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
          let teachers = [this.facilitator].concat(this.professionals)
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
      case ProposalPhases.HEADCOUNT_EXCEEDED:
        break;
      case ProposalPhases.FINISHED:
        if(!this.isFinished) this.finishProposal();
        break;
    }
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
    } else if(this.representatives.length > this.representativeHeadcount) {
      return {
        code: ProposalPhases.HEADCOUNT_EXCEEDED,
        report: `this.representatives.length=${this.representatives.length} and this.representativeHeadcount=${this.representativeHeadcount}`
      }  
    } else {
      return {
        code: ProposalPhases.UNKNOWN_ERROR,
        report: `Proposal.validate(): Unknown error.`
      }  
  
    }
  }
  assignProposer(proposer){
    proposer.status = PersonalStatus.DELIBERATING;
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
    s.lap('pckRep_a')
    let candidates = filterM(s.people, (k,v)=> (v.status === PersonalStatus.CANDIDATE && 16 <= v.age) );
    s.lap('pckRep_b')
    if(lengthM(candidates) < 30) {
      // this.representatives = [];
      this.finishProposal();
      s.lap('pckRep_c')
    } else {
      let cache = [];
      this.representatives = [...Array(this.representativeHeadcount)]
      .map((v,i)=>{
        s.lap('pckRep_e')
        let candidate = sampleM(candidates);
        s.lap('pckRep_f')
        while(!candidate || cache.includes(candidate)){
          // refresh rand until it is to be unique.
          candidate = sampleM(candidates);
        }
        s.lap('pckRep_g')
        cache.push(candidate);
        s.lap('pckRep_h')

        candidate.status = PersonalStatus.DELIBERATING;
        s.updateCitizen(candidate);
        s.lap('pckRep_i')

        return candidate;
      })
      s.lap('pckRep_d')
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
    this.age = this.lifetime - Random.number(0.5, this.lifetime);
    this.status = PersonalStatus.INACTIVE;
  }
  masquerade(){
    if(this.isSuffrage()){
      this.status = PersonalStatus.CANDIDATE;      
    } else {
      this.status = PersonalStatus.INACTIVE;
    }
    return this;
  }
  isSuffrage(){
    let code = this.validate().code;
    return code === LifeStage.SUFFRAGE || code === LifeStage.WORKFORCE;
  }
  tick():Citizen{
    let s = state.get();
    let context = this.validate();

    s.lap('ppl_removeCitizen_bf');
    if(context.code === LifeStage.DEATH){
      state.get().removeCitizen(this)
    }
    s.lap('ppl_removeCitizen_af');



    if(
        (context.code === LifeStage.SUFFRAGE || context.code === LifeStage.WORKFORCE)
        && this.status === PersonalStatus.INACTIVE
      ){
      this.masquerade();      
    }

    s.lap('ppl_a');
    this.earn(context)
    s.lap('ppl_b');
    this.payTax(context)
    s.lap('ppl_c');
    this.getWelfare(context)
    s.lap('ppl_d');
    this.activePoliticalAction(context)
    s.lap('ppl_e');
    this.passivePoliticalAction(context)
    s.lap('ppl_f');

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
  activePoliticalAction(context){
    let s = state.get();
    switch(context.code){
      case LifeStage.SUFFRAGE:
      case LifeStage.WORKFORCE:
      case LifeStage.NURSING:
        s.lap('actvPolAc_a');
        if(
          (this.annualSalary/12 > 5000 || this.intelligenceDeviation > 55)
          && Random.number(0, 365/100) === 0
          && this.age >= 16
          && this.status === PersonalStatus.CANDIDATE
        ) {
          s.lap('actvPolAc_b');
          this.submitProposal();
          s.lap('actvPolAc_c');
        }
        s.lap('actvPolAc_d');
        break;
      case LifeStage.DEATH:
        break;
    }
  }
  submitProposal(){
    let s = state.get();
    s.lap('ctznSubPrp_a');
    if(s.summaryStore.freeRatio > PARTICIPATION_THRESHOLD){
      s.lap('ctznSubPrp_c');
      s.submitProposal(this, ProblemTypes.NORMAL)
      s.lap('ctznSubPrp_d');
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

    s.appendRecord('population', `hd${tick}`, lengthM(s.people));
    s.appendRecord('population_in_deliberation', `hd${tick}`, lengthM(filterM(s.people, (k,v)=> v.status === PersonalStatus.DELIBERATING )));
    s.appendRecord('population_ready', `hd${tick}`, summary.population_ready);
    s.appendRecord('num_facilitator', `hd${tick}`, s.facilitators.length);
    s.appendRecord(`num_professional_${s.domains[0]}`, `hd${tick}`, s.professionals[s.domains[0]].length);
    s.appendRecord(`num_supremeJudge`, `hd${tick}`, s.supremeJudges.length);
    s.appendRecord(`num_proposals`, `hd${tick}`, lengthM(s.proposals));
    s.appendRecord('population_suffrage', `hd${tick}`, summary.population_suffrage);
    s.appendRecord(`freeRatio`, `hd${tick}`, summary.freeRatio);
    s.appendRecord(`num_proposalOngoing`, `hd${tick}`, summary.ongoingProposals);
    s.appendRecord(`num_proposalApproved`, `hd${tick}`, lengthM(filterM(s.proposals, (k,v)=>v.isApproved)));
    s.appendRecord('num_facilitator_in_deliberation', `hd${tick}`, s.facilitators.filter(p=>p.status === PersonalStatus.DELIBERATING).length);
    s.appendRecord(`num_supremeJudge_in_deliberation`, `hd${tick}`, s.supremeJudges.filter(p=>p.status === PersonalStatus.DELIBERATING).length);
  }
}