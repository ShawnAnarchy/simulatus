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
  annualRevenue: number;
  annualExpense: number;
  annualSeigniorage: number;
  annualInfrationRate: number;
  proposals: Array<Proposal>;
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
  professionals: Array<Professional>;


  constructor(){
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
    citizens.map(c=> c.tick() )
    miscellaneousAdministrations.map(a=> a.tick() )
    AofMedia.tick()
    AofEducation.tick()
    AofSurveillance.tick()
    AofPolice.tick()
    AofJurisdiction.tick()
    AofKYC.tick()
    AofTEEManager.tick()
    supremeJudges.map(a=> a.tick() )
    facilitators.map(a=> a.tick() )
    professionals.map(a=> a.tick() )
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
  FINAL_JUDGE = 'f',
  HEADCOUNT_EXCEEDED = 'h'
}
class Proposal implements ClockInterface {
  problemType: ProblemTypes;
  durationDays:number;
  spentDays:number;
  representatives: Array<citizens>;
  representativeHeadcount: number;
  progressismDegree: number;
  humanrightsDegree: number;

  constructor(){
    this.durationDays = this.getDurationDays()
    this.spentDays = 0;
    this.representativeHeadcount = 30;
    this.progressismDegree = 30 + rand(60)
    this.humanrightsDegree = 30 + rand(60)
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
}

enum LifeStage {
  SUFFRAGE = 's',
  WORKFORCE = 'w',
  MARIAGE = 'm',
  CAN_BE_PREGNANT = 'g',
  ELDERLY = 'e',
  NURSING = 'n',
  DEATH = 'd'
}
class Citizen implements ClockInterface {
  annualSalary: number;
  intelligence: number;
  isSocioPath: bool;
  age: number;
  biologicallyCanBePregnant: bool; 
  lifetime: number;

  constructor(){
    this.annualSalary = 0;
    this.IQ = 30 + rand(60);
    this.ConspiracyPreference = 100 - this.IQ + rand(10) - rand(10);
    this.CultPreference = 100 - this.IQ + rand(10) - rand(10);
    this.isSocioPath = !!rand(1);
    this.progressismPreference = 50*((this.IQ*this.ConspiracyPreference*this.CultPreference)/(50*50*50))^(1/3);
    this.humanrightsPreference = this.isSocioPath ? 30 :
      (this.progressismPreference > 60) ? 40 :
      (this.progressismPreference > 50) ? 50 :
      (this.progressismPreference > 40) ? 60 : 70;
    this.biologicallyCanBePregnant = !!rand(1)
  }
  tick(){
    this.age += 3/365
    let validationResult = this.validate();

    //TODO random active political action
    //TODO random passive political action
    //TODO pay tax
    //TODO get welfare

    switch(validationResult.code){
      case LifeStage.SUFFRAGE:
        return;
      case LifeStage.WORKFORCE:
        this.annualSalary += 2000
        //TODO How we should tie the life stage and salary
        return;
      case LifeStage.MARIAGE:
        return;
      case LifeStage.CAN_BE_PREGNANT:
        return;
      case LifeStage.NURSING:
        return;
      case LifeStage.DEATH:
        return;
    }
  }
  validate(){
    if (this.age > this.lifetime) {
      return { code: LifeStage.DEATH, report: "" }
    } else if (this.age < 16 || 75 < this.age) {
      return { code: LifeStage.NURSING, report: "" }
    } else if (this.age === 16) {
      return { code: LifeStage.SUFFRAGE, report: "" }
    } else if (this.age > 22) {
      return { code: LifeStage.WORKFORCE, report: "" }
    } else if (this.age > 65) {
      return { code: LifeStage.ELDERLY, report: "" }
    } else if (14 < this.age && this.age < 50 && biologicallyCanBePregnant) {
      return { code: LifeStage.CAN_BE_PREGNANT, report: "" }
    }
    //TODO give birth as its tendency of giving birth
    //TODO political status
    //TODO social status
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
    this.id = rand(1000000000000);
    this.headCount = 8 + rand(6);
    this.monthlyBudget = this.headCount
      .map(_=> 3000 + rand(2000) )
      .reduce((sum, el) => sum + el, 0);
    this.curruption = rand(30);
  }

  tick(){
    this.curruption += rand(3)/10
  }

}