import * as Random from 'random.ts'

type validationResult = {
  code: string,
  report: string
}
interface ClockInterface {
  tick(): void;
  validate: validationResult;
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
  facilitators: Array<Facilitator>;
  professionals: Map<string, Array<Professional>>;


  constructor(){
    this.domains = [];
    this.AofMedia = new Administration()
    this.AofEducation = new Administration()
    this.AofSurveillance = new Administration()
    this.AofPolice = new Administration()
    this.AofJurisdiction = new Administration()
    this.AofKYC = new Administration()
    this.AofTEEManager = new Administration()
  }

  payTax(amount){
    this.treasury += amount;
  }
  withdrawWelfare(amount){
    this.treasury -= amount;
  }
  addDomain(name){
    this.domains.push(name);
  }
  addCitizen(){
    this.people.push(new Citizen())
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
    this.professionals[domain].push(professionals)
  }

  getPopulation(){
    return this.people.length
  }
  getGDP(){
    return this.people.map(p=> p.annualSalary ).reduce((sum, el) => sum + el, 0);
  }
  tick(){
    let validationResult = this.validate();
    if( !validationResult.code ) throw new Error(`DAO4N Error: Assumption viorated. ${validationResult.report}`)

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
      code: true,
      report: ""
    }
  }
  submitProposal(proposer){
    this.proposals.push(new Proposal(proposer, this))
  }
  removeProposal(proposalId){
    let index = this.proposals.map((p,i)=> p.id === proposalId ? i : 0).reduce(s,i=> s+i, 0)
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
const enum ProposalPhasees {
  INITIAL_JUDGE = 'i',
  FACILITATOR_ASSIGNMENT = 'fa',
  DOMAIN_ASSIGNMENT = 'da',
  PROFESSIONAL_ASSIGNMENT = 'pa',
  DELIBERATION = 'd',
  FINAL_JUDGE = 'f',
  HEADCOUNT_EXCEEDED = 'h'
}
class Proposal implements ClockInterface {
  s: StateMachine;
  id:string;
  proposer: Citizen;
  facilitator?: Citizen;
  professionals: Array<Citizen>;
  domains: Array<Domains>
  problemType: ProblemTypes;
  durationDays:number;
  spentDays:number;
  representatives: Array<Citizen>;
  representativeHeadcount: number;
  progressismDegree: number;
  humanrightsDegree: number;

  constructor(proposer, s){
    this.s = s;
    this.id = Random.uuid(40);
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
    switch (this.problemTypes) {
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
    let validationResult = this.validate()
    if(validationResult.code === ProposalPhasees.FINAL_JUDGE) {
      let forCount = this.representatives.filter(r=>{
        let res = false;
        if( r.humanrightsPreference < 50 && r.progressismPreference > this.progressismPreference ) {
          res = true
        } else if ( r.progressismPreference > this.progressismPreference && r.humanrightsPreference > this.humanrightsDegree ) {
          res = true
        }
        return res;
      }).length
      if(forCount > representatives.length/2){
        // Approved
        // TODO push administrationToBeCreated to the StateMachine
        // TODO is the StateMachine to be global variable?
      } else {
        // Denied
      }
    } else if (validationResult.code === ProposalPhasees.INITIAL_JUDGE){
      //TODO 
    } else {

    }

    //TODO
    this.spentDays += 3
  }
  validate(){
    if(this.spentDays > this.durationDays) {
      return {
        code: ProposalPhasees.FINAL_JUDGE,
        report: ""
      }  
    } else if(this.spentDays === 0) {
      return {
        code: ProposalPhasees.INITIAL_JUDGE,
        report: ""
      }  
    } else if(this.representatives.length > this.representativeHeadcount) {
      return {
        code: ProposalPhasees.HEADCOUNT_EXCEEDED,
        report: `this.representatives.length=${this.representatives.length} and this.representativeHeadcount=${this.representatives.length}`
      }  
    } else {
  
    }
    //TODO check duration and spentDays 
  }
  initialJudge(){
    if(this.status === ProposalPhasees.INITIAL_JUDGE){
      if(this.proposer.IQ > 50) {
        this.status = ProposalPhasees.FACILITATOR_ASSIGNMENT
        return;
      } else {
        this.s.destroyProposal(this.id)
      }
    } else {
      console.error('Proposal.initialJudge: wrong phase of proposal')
    }
  }
  pickFacilitator(){
    let availableFacilitators = this.s.facilitators.filter(f=> !f.isBusy )
    this.facilitator = availableFacilitators[Random.number(0, availableFacilitators.length-1)]
  }
  pickDomains(){
    let rand = Random.number()
    this.domains = [];
  }
  pickProfessionals(){
    this.s.pickProfessionals(this)
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
  DEATH = 'd'
}
class Citizen implements ClockInterface {
  s: StateMachine;
  id: string;
  annualSalary: number;
  intelligence: number;
  isSocioPath: bool;
  age: number;
  biologicallyCanBePregnant: bool; 
  lifetime: number;

  constructor(s){
    this.s = s;
    this.id = Random.uuid(40)
    this.annualSalary = 0;
    this.IQ = 30 + Random.number(0, 60);
    this.ConspiracyPreference = 100 - this.IQ + Random.number(0, 10) - Random.number(0, 10);
    this.CultPreference = 100 - this.IQ + Random.number(0, 10) - Random.number(0, 10);
    this.isSocioPath = !!Random.number(0, 1);
    this.progressismPreference = 50*((this.IQ*this.ConspiracyPreference*this.CultPreference)/(50*50*50))^(1/3);
    this.humanrightsPreference = this.isSocioPath ? 30 :
      (this.progressismPreference > 60) ? 40 :
      (this.progressismPreference > 50) ? 50 :
      (this.progressismPreference > 40) ? 60 : 70;
    this.biologicallyCanBePregnant = !!Random.number(0, 1)

  }
  tick(){
    this.age += 3/365
    let validationResult = this.validate();

    this.earn(validationResult)
    this.payTax(validationResult)
    this.getWelfare(validationResult)
    this.activePoliticalAction(validationResult)
    this.passivePoliticalAction(validationResult)
    
    if(validationResult.code === LifeStage.DEATH){
      this.s.removeCitizen(this.id)
    }
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
    }
    //TODO give birth as its tendency of giving birth
    //TODO political status
    //TODO social status
  }
  earn(validationResult){
    switch(validationResult.code){
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
  payTax(validationResult){
    let taxRate;
    switch(validationResult.code){
      case LifeStage.SUFFRAGE:
        taxRate = 0;
        return;
      case LifeStage.WORKFORCE:
        if (this.annualSalary < 2000*12) {
          let taxRate = 0.1;
        } else if (2000*12 <= this.annualSalary && this.annualSalary < 3000*12) {
          let taxRate = 0.13;
        } else if (3000*12 <= this.annualSalary && this.annualSalary < 4000*12) {
          let taxRate = 0.15;
        } else if (4000*12 <= this.annualSalary && this.annualSalary < 5000*12) {
          let taxRate = 0.17;
        } else if (5000*12 <= this.annualSalary && this.annualSalary < 6000*12) {
          let taxRate = 0.19;
        } else if (6000*12 <= this.annualSalary && this.annualSalary < 7000*12) {
          let taxRate = 0.21;
        } else if (7000*12 <= this.annualSalary && this.annualSalary < 8000*12) {
          let taxRate = 0.23;
        } else if (8000*12 <= this.annualSalary && this.annualSalary < 9000*12) {
          let taxRate = 0.25;
        } else if (9000*12 <= this.annualSalary && this.annualSalary < 10000*12) {
          let taxRate = 0.27;
        } else {
          let taxRate = 0.38;
        }
      return;
      case LifeStage.NURSING:
        let taxRate = 0;
        return;
      case LifeStage.DEATH:
        let taxRate = 0;
        return;

      this.annualSalary = this.annualSalary*(1-taxRate)
      this.s.payTax(this.annualSalary*taxRate)
    }
  }
  getWelfare(validationResult){
    let welfareAmount;
    switch(validationResult.code){
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
  activePoliticalAction(validationResult){
    switch(validationResult.code){
      case LifeStage.SUFFRAGE:
      case LifeStage.WORKFORCE:
      case LifeStage.NURSING:
        if(this.age < 16){
        } else {
          if(this.annualSalary/12 > 5000 || this.IQ > 55) {
            if(Random.number(0, 365/3) === 0){
              this.s.submitProposal(this)
              //TODO new Proposal(this)
              //TODO IQ of proposer is important for the initial judge
            }
          }
        }
        return;
      case LifeStage.DEATH:
        return;
    }
  }
  passivePoliticalAction(validationResult){

  }
}

class SupremeJudge implements ClockInterface {
  tick(){}
  validate(){
    return {
      code: "",
      report: ""
    }
  }
}
class Facilitator implements ClockInterface {
  tick(){}
  validate(){
    return {
      code: "",
      report: ""
    }
  }
}
class Professional implements ClockInterface {
  tick(){}
  validate(){
    return {
      code: "",
      report: ""
    }
  }
}


class Administration implements ClockInterface {
  id: number;
  monthlyBudget: number;
  curruption: number;
  headCount: number;

  constructor(){
    this.id = Random.uuid(40);
    this.headCount = 8 + Random.number(0, 6);
    this.monthlyBudget = this.headCount
      .map(_=> 3000 + Random.number(0, 2000) )
      .reduce((sum, el) => sum + el, 0);
    this.curruption = Random.number(0, 30);
  }

  tick(){
    this.curruption += Random.number(0, 3)/10
  }

}

(function(){
  let s = new StateMachine();
  for(var i=0; i<64000; i++){
    s.addCitizen()
  }
  s.addDomain('finance')
  s.addDomain('military')
  s.addDomain('publicSafety')
  s.addDomain('physics')
  s.addDomain('biology')
  for(var i=0; i<100; i++){
    s.addFacilitator(s.people[Random.number(0, s.people.length-1)])
  }
  for(var i=0; i<15; i++){
    s.addSupremeJudge(s.people[Random.number(0, s.people.length-1)])
  }
  for(var i=0; i<50; i++){
    for(var j=0; j<s.domains.length; j++){
      s.addProfessional(s.domains[j], s.people[Random.number(0, s.people.length-1)])
    }
  }
  for(var i=0; i<120; i++){
    s.tick();
  }
})()