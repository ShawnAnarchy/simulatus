import * as Random from 'random.ts'
import * as Util from './util'
let trace = Util.trace

const TICKING_TIME = 0.5

type ValidationResult = {
  code: string,
  report: string
}
interface ClockInterface {
  tick(): void;
  validate(): ValidationResult;
}

class StateMachine implements ClockInterface {
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
  addCitizen(){
    this.people.push(new Citizen(this))
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
  submitProposal(proposer, problemType){
    this.proposals.push(new Proposal(proposer, this, problemType))
  }
  removeProposal(proposalId){
    let index = this.proposals.map((p,i)=> p.id === proposalId ? i : 0).reduce((s,i)=> s+i, 0)
    this.proposals.splice(index, 1)
  }
}

const enum ProblemTypes {
  ASSIGNMENT = 'a',
  DISMISSAL = 'd',
  NORMAL = 'n',
  HEAVY = 'h',
  VARIABLE_UPDATE = 'vu'
}
const enum ProposalPhases {
  INITIAL_JUDGE = 'i',
  FACILITATOR_ASSIGNMENT = 'fa',
  DOMAIN_ASSIGNMENT = 'da',
  PROFESSIONAL_ASSIGNMENT = 'pa',
  DELIBERATION = 'd',
  FINAL_JUDGE = 'f',
  HEADCOUNT_EXCEEDED = 'h',
  UNKNOWN_ERROR = "ue"
}
class Proposal implements ClockInterface {
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

  constructor(proposer, s, problemType){
    this.s = s;
    this.id = Random.uuid(40);
    this.problemType = problemType;
    this.proposer = proposer;
    this.facilitator = null;
    this.domains = [];
    this.professionals = [];
    this.durationDays = this.getDurationDays();
    this.spentDays = 0;
    this.representativeHeadcount = 30;
    this.progressismDegree = 30 + Random.number(0, 60)
    this.humanrightsDegree = 30 + Random.number(0, 60)
    this.administrationToBeCreated = new Administration()
    this.vestedMonthlyBudget = this.administrationToBeCreated.monthlyBudget
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

  tick(){
    let context = this.validate()
    
    switch(context.code){
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
          this.s.miscellaneousAdministrations.push(this.administrationToBeCreated)
        } else {
          this.s.removeProposal(this.id)
        }
        return;
      case ProposalPhases.INITIAL_JUDGE:
        if(this.proposer.IQ > 50){
          // just tick if proposal is pseudo-reasonable
        } else {
          this.s.removeProposal(this.id)
        }
        return;
      case ProposalPhases.FACILITATOR_ASSIGNMENT:
        let f = this.s.facilitators.filter(f=> !f.isBusy )
        this.facilitator = f[Random.number(0, f.length-1)]
        return;
      case ProposalPhases.DOMAIN_ASSIGNMENT:
        this.pickDomains()
        return;
      case ProposalPhases.PROFESSIONAL_ASSIGNMENT:
        this.pickProfessionals()
        return;
      case ProposalPhases.DELIBERATION:
        let teachers = [this.facilitator].concat(this.professionals)
        let avgTeacherIQ = teachers.map(t=> t.IQ ).reduce((s,i)=> s+i ,0)/teachers.length
        let dailyEffect = (avgTeacherIQ - 50)/this.durationDays
        this.representatives = this.representatives.map(r=> r.affectByDeliberation(dailyEffect) )
        return;
      case ProposalPhases.HEADCOUNT_EXCEEDED:
        return;
    }

    this.spentDays += TICKING_TIME
  }
  validate(){
    if(this.spentDays === 0) {
      return { code: ProposalPhases.INITIAL_JUDGE, report: "" }
    } else if(0 < this.spentDays && !this.facilitator) {
      return { code: ProposalPhases.FACILITATOR_ASSIGNMENT, report: "" }
    } else if(!!this.facilitator && !this.domains) {
      return { code: ProposalPhases.DOMAIN_ASSIGNMENT, report: "" }
    } else if(!!this.facilitator && !!this.domains && !this.professionals) {
      return { code: ProposalPhases.PROFESSIONAL_ASSIGNMENT, report: "" }
    } else if(!!this.facilitator && !!this.domains && !!this.professionals) {
      return { code: ProposalPhases.DELIBERATION, report: "" }  
    } else if(this.spentDays === this.durationDays) {
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
    let candidates = this.s.facilitators.filter(f=> !f.isBusy )
    let randIndex = Random.number(0, candidates.length-1)
    let selectedFacilitator = candidates[randIndex]
    selectedFacilitator.isBusy = true
    this.s.facilitators[randIndex] = selectedFacilitator
    this.facilitator = selectedFacilitator
  }
  pickDomains(){
    let rand = Random.number(0, this.s.domains.length-1);
    let shuffledDomains = Util.shuffle(this.s.domains);
    [...Array(rand)].map((x,i)=> this.domains.push(shuffledDomains[i])  );
  }
  pickProfessionals(){
    this.domains.map(d=>{
      let candidates = this.s.professionals[d].filter(p=> !p.isBusy )
      let randIndex = Random.number(0, candidates.length-1)
      let selectedProfessional = candidates[randIndex]
      selectedProfessional.isBusy = true;
      this.s.professionals[d][randIndex] = selectedProfessional;
      this.professionals.push( selectedProfessional )
    })
  }
  deliberation(){
    this.progressismDegree += Random.number(0, 10) - Random.number(0, 5)
    this.humanrightsDegree += Random.number(0, 10) - Random.number(0, 5)
  }
  finalJudge(){

  }
}

enum LifeStage {
  SUFFRAGE = 's',
  WORKFORCE = 'w',
  NURSING = 'n',
  DEATH = 'd',
  OTHER = 'o'
}
class Citizen implements ClockInterface {
  s: StateMachine;
  id: string;
  annualSalary: number;
  IQ: number;
  conspiracyPreference: number;
  cultPreference: number;
  isSocioPath: boolean;
  isTakingCareForThe7thOffsprings: boolean; 
  progressismPreference: number;
  humanrightsPreference: number;
  age: number;
  biologicallyCanBePregnant: boolean; 
  lifetime: number;

  constructor(s){
    this.s = s;
    this.id = Random.uuid(40)
    this.annualSalary = 0;
    this.IQ = 30 + Random.number(0, 60);
    this.conspiracyPreference = 100 - this.IQ + Random.number(0, 10) - Random.number(0, 10);
    this.cultPreference = 100 - this.IQ + Random.number(0, 10) - Random.number(0, 10);
    this.isSocioPath = !!(Random.number(0, 1) & Random.number(0, 1) & Random.number(0, 1) & Random.number(0, 1) );
    this.isTakingCareForThe7thOffsprings = !!(Random.number(0, 1) & Random.number(0, 1) & Random.number(0, 1) & Random.number(0, 1) );
    this.progressismPreference = 50*((this.IQ*this.conspiracyPreference*this.cultPreference)/(50*50*50))^(1/3);
    this.humanrightsPreference = (this.isSocioPath) ? 30 :
      (this.isTakingCareForThe7thOffsprings) ? 70 :
      (this.progressismPreference > 60) ? 40 :
      (this.progressismPreference > 50) ? 50 :
      (this.progressismPreference > 40) ? 60 : 70;
    this.biologicallyCanBePregnant = !!Random.number(0, 1)
    this.lifetime = Random.number(65, 85) + Random.number(0, 35) - Random.number(0, 65)
    this.age = this.lifetime - Random.number(0, this.lifetime)
  }
  tick(){
    let context = this.validate();

    this.earn(context)
    this.payTax(context)
    this.getWelfare(context)
    this.activePoliticalAction(context)
    this.passivePoliticalAction(context)
    
    if(context.code === LifeStage.DEATH){
      this.s.removeCitizen(this.id)
    }

    this.age += TICKING_TIME/365
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
  earn(context){
    switch(context.code){
      case LifeStage.SUFFRAGE:
        this.annualSalary = -1500*12
        return;
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
        return;
      case LifeStage.NURSING:
        this.annualSalary = -1000*12
        return;
      case LifeStage.DEATH:
        this.annualSalary = 0
        return;
    }
  }
  payTax(context){
    let taxRate;
    switch(context.code){
      case LifeStage.SUFFRAGE:
        taxRate = 0;
        return;
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
      return;
      case LifeStage.NURSING:
        taxRate = 0;
        return;
      case LifeStage.DEATH:
        taxRate = 0;
        return;

      this.annualSalary = this.annualSalary*(1-taxRate)
      this.s.payTax(this.annualSalary*taxRate)
    }
  }
  getWelfare(context){
    let welfareAmount;
    switch(context.code){
      case LifeStage.SUFFRAGE:
        welfareAmount = 1000*12
        return;
      case LifeStage.WORKFORCE:
        welfareAmount = 100*12
      return;
      case LifeStage.NURSING:
        welfareAmount = 2000*12
        return;
      case LifeStage.DEATH:
        welfareAmount = 0
        return;
    }
    this.annualSalary = this.annualSalary + welfareAmount
    this.s.withdrawWelfare(welfareAmount)

  }
  activePoliticalAction(context){
    switch(context.code){
      case LifeStage.SUFFRAGE:
      case LifeStage.WORKFORCE:
      case LifeStage.NURSING:
        if(this.age < 16){
        } else {
          if(this.annualSalary/12 > 5000 || this.IQ > 55) {
            if(Random.number(0, 365/3) === 0){
              this.s.submitProposal(this, ProblemTypes.NORMAL)
            }
          }
        }
        return;
      case LifeStage.DEATH:
        return;
    }
  }
  passivePoliticalAction(context){
    // skip: passive action is automatic in the simulator
  }
  affectByDeliberation(point){
    this.IQ += point
    this.conspiracyPreference -= point
    this.cultPreference -= point
    this.isSocioPath = false
    this.progressismPreference = 50*((this.IQ*this.conspiracyPreference*this.cultPreference)/(50*50*50))^(1/3);
    this.humanrightsPreference += point
    return this
  }
}
class CorruptionResistantOfficer extends Citizen {
  isBusy: boolean;
  constructor(s: StateMachine, candidate: Citizen){
    super(s);
    this.isBusy = false;
    this.s = s;
    this.id = candidate.id
    this.annualSalary = candidate.annualSalary
    this.IQ = candidate.IQ
    this.conspiracyPreference = candidate.conspiracyPreference
    this.cultPreference = candidate.cultPreference
    this.isSocioPath = candidate.isSocioPath
    this.progressismPreference = candidate.progressismPreference
    this.humanrightsPreference = candidate.humanrightsPreference
    this.biologicallyCanBePregnant = candidate.biologicallyCanBePregnant
    this.lifetime = candidate.lifetime
  }
}
class SupremeJudge extends CorruptionResistantOfficer {
}
class Facilitator extends CorruptionResistantOfficer {
}
class Professional extends CorruptionResistantOfficer {
}


class Administration implements ClockInterface {
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


const POPULATION = 64000;
const SIMULATE_FOR_DAYS = 60;
const FACILITATORS_INITIAL_HEADCCOUNT = 100;
const PROFESSIONALS_INITIAL_HEADCCOUNT_PER_DOMAIN = 50;
const SUPREME_JUDGES_INITIAL_HEADCCOUNT = 15;
(function(){
  let s = new StateMachine();
  for(var i=0; i<POPULATION; i++){
    s.addCitizen()
  }
  s.addDomain('finance')
  s.addDomain('military')
  s.addDomain('publicSafety')
  s.addDomain('physics')
  s.addDomain('biology')
  for(var i=0; i<FACILITATORS_INITIAL_HEADCCOUNT; i++){
    let candidate = s.people[Random.number(0, s.people.length-1)]
    s.addFacilitator(new Facilitator(s, candidate))
  }
  for(var i=0; i<SUPREME_JUDGES_INITIAL_HEADCCOUNT; i++){
    let candidate = s.people[Random.number(0, s.people.length-1)]
    s.addSupremeJudge(new SupremeJudge(s, candidate))
  }
  for(var i=0; i<PROFESSIONALS_INITIAL_HEADCCOUNT_PER_DOMAIN; i++){
    for(var j=0; j<s.domains.length; j++){
      let candidate = s.people[Random.number(0, s.people.length-1)]
      s.addProfessional(s.domains[j], new Professional(s, candidate))
    }
  }
  for(var i=0; i<SIMULATE_FOR_DAYS*2; i++){
    s.tick();
  }

  trace(s)
})()