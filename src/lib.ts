import * as Random from './random'
import * as Util from './util'
import {
  TICKING_TIME,
  POPULATION,
  SIMULATE_FOR_DAYS,
  FACILITATORS_INITIAL_HEADCCOUNT,
  PROFESSIONALS_INITIAL_HEADCCOUNT_PER_DOMAIN,
  SUPREME_JUDGES_INITIAL_HEADCCOUNT,
  UPPERBOUND,
  LOWERBOUND } from './const'
let squash = Util.squash;



export type ValidationResult = {
  code: string,
  report: string
}
interface ClockInterface {
  tick(): void;
  validate(): ValidationResult;
}

export class StateMachine implements ClockInterface {
  people: Array<Citizen>;
  treasury: number;
  annualRevenue: number;
  annualExpense: number;
  annualSeigniorage: number;
  annualInfrationRate: number;
  proposals: Array<Proposal>;
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


  constructor(){
    this.people = [];
    this.treasury = 0;
    this.annualRevenue = 0;
    this.proposals = [];
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
    this.people.push(citizen);
    return citizen;
  }
  removeCitizen(citizenId){
    let index = this.people.map((c,i) => c.id == citizenId ? i : 0).reduce((s,i)=> s+i,0)
    this.people.splice(index, 1);
  }
  addSupremeJudge(judge){
    this.supremeJudges.push(judge)
  }
  addFacilitator(facilitators){
    this.facilitators.push(facilitators)
  }
  addProfessional(domain, professional){
    this.professionals[domain].push(professional)
  }

  getPopulation(){
    return this.people.length
  }
  getGDP(){
    return this.people.map(p=> p.annualSalary ).reduce((sum, el) => sum + el, 0);
  }
  tick(){
    let context = this.validate();
    if( !context.code ) throw new Error(`DAO4N Error: Assumption viorated. ${context.report}`)

    // TODO tick all actors
    this.people.map(c=> c.tick() )
    this.proposals.map(p=> p.tick() )
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
    // TODO each ticks refer this https://paper.dropbox.com/doc/--A94iOUxIv4si~XPY5jFo1TMKAg-OSm6HZnzqnEz61jbe0izX


    // TODO calculate stats


  }
  validate(){
    // TODO check CROs' max headcount
    // TODO check budget exceeding
    // TODO check deregistration rate

    return {
      code: "a",
      report: ""
    }
  }
  submitProposal(proposer, problemType): Proposal{
    let proposal = new Proposal(proposer, problemType);
    this.proposals.push(proposal);
    return proposal;
  }
  approveProposal(proposal){
    this.miscellaneousAdministrations.push(proposal.administrationToBeCreated)
    //TODO: Reward for participants
    //TODO: There's no tie between admin and vestedMonthlyBudget
  }
  updateProposal(proposal){
    let pid = proposal.id;
    let index = this.proposals.map((p,i)=> p.id === pid ? i : 0).reduce((s,i)=> s+i, 0)
    this.proposals.splice(index, 1)
    this.proposals.push(proposal)

    let participants = [proposal.proposer].concat(proposal.representatives).concat(proposal.professionals);
    if(proposal.facilitator) participants.push(proposal.facilitator)
    let partIds = participants.map(p=>p.id)
    partIds.map(partId=>{
      let partIndex = this.people.map((p,i)=> p.id === partId ? i : 0).reduce((s,i)=> s+i, 0)
      this.people.splice(partIndex, 1);
    })
    participants.map(p=>{
      this.people.push(p);
    })
  }
}
export let state = (() => {
  var instance: StateMachine;

  function createInstance():StateMachine {
    var object: StateMachine = new StateMachine();
    return object;
  }

  return {
    get: ()=>{
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
    set: _state=>{
      instance = _state
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

  constructor(proposer, problemType){
    this.id = Random.uuid(40);
    this.problemType = problemType;
    this.proposer = proposer;
    this.facilitator = null;
    this.domains = [];
    this.professionals = [];
    this.durationDays = this.getDurationDays();
    this.spentDays = 0;
    this.representativeHeadcount = 30;
    this.representatives = []
    this.pickRepresentatives()
    this.progressismDegree = 30 + Random.number(0, 60)
    this.humanrightsDegree = 30 + Random.number(0, 60)
    this.administrationToBeCreated = new Administration()
    this.vestedMonthlyBudget = this.administrationToBeCreated.monthlyBudget
    this.isFinished = false
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
    this.isFinished = true;
    this.proposer.isBusy = false;
    this.representatives = this.representatives.map(r=>{ r.isBusy = false; return r; });
    if(this.facilitator) this.facilitator.isBusy = false;
    this.professionals = this.professionals.map(p=>{ p.isBusy = false; return p; });
    state.get().updateProposal(this);
  }

  tick(){
    let context = this.validate()
    switch(context.code){
      case ProposalPhases.INITIAL_JUDGE:
        if(this.proposer.intelligenceDeviation > 50){
          // just tick if proposal is pseudo-reasonable
        } else {
          this.finishProposal()
        }
        break;
      case ProposalPhases.FACILITATOR_ASSIGNMENT:
        let f = state.get().facilitators.filter(f=> !f.isBusy )
        this.facilitator = f[Random.number(0, f.length-1)]
        break;
      case ProposalPhases.DOMAIN_ASSIGNMENT:
        this.pickDomains()
        break;
      case ProposalPhases.PROFESSIONAL_ASSIGNMENT:
        this.pickProfessionals()
        break;
      case ProposalPhases.DELIBERATION:
        if(!this.isFinished){
          let teachers = [this.facilitator].concat(this.professionals)
          let avgTeacherintelligenceDeviation = teachers.map(t=> t.intelligenceDeviation ).reduce((s,i)=> s+i ,0)/teachers.length
          let dailyEffect = (avgTeacherintelligenceDeviation - 50)/this.durationDays
          this.representatives = this.representatives.map(r=> r.affectByDeliberation(dailyEffect) )
          this.modificationRequests();
        }
        break;
      case ProposalPhases.FINAL_JUDGE:
        let forCount = this.representatives.filter(r=>{
          let res = false;
          if( r.humanrightsPreference < 50 && r.progressismPreference > this.progressismDegree ) {
            res = true
          } else if ( r.progressismPreference > this.progressismDegree && r.humanrightsPreference > this.humanrightsDegree ) {
            res = true
          }
          return res;
        }).length
        if(forCount > this.representatives.length/2){
          state.get().approveProposal(this);
          this.finishProposal();
        } else {
          this.finishProposal();
        }
        break;
      case ProposalPhases.HEADCOUNT_EXCEEDED:
        break;
    }
    this.spentDays += TICKING_TIME
  }
  validate(){
    if(this.spentDays === 0) {
      return { code: ProposalPhases.INITIAL_JUDGE, report: "" }
    } else if(0 < this.spentDays && !this.facilitator && this.spentDays < this.durationDays) {
      return { code: ProposalPhases.FACILITATOR_ASSIGNMENT, report: "" }
    } else if(!!this.facilitator && this.domains.length === 0 && this.spentDays < this.durationDays) {
      return { code: ProposalPhases.DOMAIN_ASSIGNMENT, report: "" }
    } else if(!!this.facilitator && this.domains.length > 0 && this.professionals.length === 0 && this.spentDays < this.durationDays) {
      return { code: ProposalPhases.PROFESSIONAL_ASSIGNMENT, report: "" }
    } else if(!!this.facilitator && this.domains.length > 0 && this.professionals.length > 0 && this.spentDays < this.durationDays) {
      return { code: ProposalPhases.DELIBERATION, report: "" }  
    } else if(!!this.facilitator && this.domains.length > 0 && this.professionals.length > 0 && this.spentDays === this.durationDays) {
      return { code: ProposalPhases.FINAL_JUDGE, report: "" }
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
  pickFacilitator(){
    let candidates = state.get().facilitators.filter(f=> !f.isBusy )
    let randIndex = Random.number(0, candidates.length-1)
    let selectedFacilitator = candidates[randIndex]
    selectedFacilitator.isBusy = true
    state.get().facilitators[randIndex] = selectedFacilitator
    this.facilitator = selectedFacilitator
  }
  pickRepresentatives(){
    let rand = Random.number(0, this.representativeHeadcount-1);
    let shuffledPeople = Util.shuffle(state.get().people.filter(p=> (!p.isBusy && 16 <= p.age) ));
    [...Array(rand)].map((x,i)=> this.representatives.push(shuffledPeople[i])  );
  }
  pickDomains(){
    let rand = Random.number(0, state.get().domains.length-1);
    let shuffledDomains = Util.shuffle(state.get().domains);
    [...Array(rand)].map((x,i)=> this.domains.push(shuffledDomains[i])  );
  }
  pickProfessionals(){
    this.domains.map(d=>{
      let candidates = state.get().professionals[d].filter(p=> !p.isBusy )
      let randIndex = Random.number(0, candidates.length-1)
      let selectedProfessional = candidates[randIndex]
      selectedProfessional.isBusy = true;
      state.get().professionals[d][randIndex] = selectedProfessional;
      this.professionals.push( selectedProfessional )
    })
  }
  modificationRequests(){
    this.progressismDegree += Random.number(0, 7) - Random.number(0, 5)
    this.humanrightsDegree += Random.number(0, 7) - Random.number(0, 5)
  }
}

export enum LifeStage {
  SUFFRAGE = 's',
  WORKFORCE = 'w',
  NURSING = 'n',
  DEATH = 'd',
  OTHER = 'o'
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
  isBusy: boolean;

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
    this.lifetime = Random.number(65, 85) + Random.number(0, 35) - Random.number(0, 65)
    this.age = this.lifetime - Random.number(0, this.lifetime);
    this.isBusy = false;
  }
  tick(){
    let context = this.validate();

    this.earn(context)
    this.payTax(context)
    this.getWelfare(context)
    this.activePoliticalAction(context)
    this.passivePoliticalAction(context)
    
    if(context.code === LifeStage.DEATH){
      state.get().removeCitizen(this.id)
    }

    this.age += TICKING_TIME/365
    this.validateAfter();
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
    switch(context.code){
      case LifeStage.SUFFRAGE:
      case LifeStage.WORKFORCE:
      case LifeStage.NURSING:
        if(this.age < 16){
        } else {
          if(this.annualSalary/12 > 5000 || this.intelligenceDeviation > 55) {
            if(Random.number(0, 365/3) === 0){
              this.submitProposal();
            }
          }
        }
        break;
      case LifeStage.DEATH:
        break;
    }
  }
  submitProposal(){
    state.get().submitProposal(this, ProblemTypes.NORMAL)
    this.isBusy = true;
  }
  passivePoliticalAction(context){
    // skip: passive action is automatic in the simulator
  }
  affectByDeliberation(point){
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
    let s = state.get();
    super();
    this.isBusy = candidate.isBusy;
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
