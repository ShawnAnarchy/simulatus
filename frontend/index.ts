import { Graph } from './graph';
import population from './records/population';
import population_in_deliberation from './records/population_in_deliberation';
import population_ready from './records/population_ready';
import freeRatio from './records/freeRatio';
import num_facilitator from './records/num_facilitator';
import num_supremeJudge from './records/num_supremeJudge';
import num_proposals from './records/num_proposals';
import num_proposalOngoing from './records/num_proposalOngoing';
import num_proposalApproved from './records/num_proposalApproved';
import num_facilitator_in_deliberation from './records/num_facilitator_in_deliberation';
import num_supremeJudge_in_deliberation from './records/num_supremeJudge_in_deliberation';

let graph = new Graph();

(()=>{
  graph.line('freeRatio', freeRatio);

  document.getElementById('freeRatio').addEventListener('click', e=>{
    graph.line('freeRatio', freeRatio);
  })
  document.getElementById('num_facilitator_in_deliberation').addEventListener('click', e=>{
    graph.line('num_facilitator_in_deliberation', num_facilitator_in_deliberation);
  })
  document.getElementById('num_proposalOngoing').addEventListener('click', e=>{
    graph.line('num_proposalOngoing', num_proposalOngoing);
  })
  document.getElementById('num_proposalApproved').addEventListener('click', e=>{
    graph.line('num_proposalApproved', num_proposalApproved);
  })

})();