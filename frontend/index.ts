import { Graph } from './graph';
import population from './records/population';
import population_in_deliberation from './records/population_in_deliberation';
import population_ready from './records/population_ready';
import num_facilitator from './records/num_facilitator';
import num_supremeJudge from './records/num_supremeJudge';
import num_proposals from './records/num_proposals';
import num_proposalOngoing from './records/num_proposalOngoing';
import num_proposalApproved from './records/num_proposalApproved';
import num_facilitator_in_deliberation from './records/num_facilitator_in_deliberation';
import num_supremeJudge_in_deliberation from './records/num_supremeJudge_in_deliberation';

let graph = new Graph();

(()=>{
  graph.line('population', population);

  document.getElementById('population').addEventListener('click', e=>{
    graph.line('population', population);
  })
  document.getElementById('population_in_deliberation').addEventListener('click', e=>{
    graph.line('population_in_deliberation', population_in_deliberation);
  })
  document.getElementById('population_ready').addEventListener('click', e=>{
    graph.line('population_ready', population_ready);
  })
  document.getElementById('num_facilitator').addEventListener('click', e=>{
    graph.line('num_facilitator', num_facilitator);
  })
  document.getElementById('num_supremeJudge').addEventListener('click', e=>{
    graph.line('num_supremeJudge', num_supremeJudge);
  })
  document.getElementById('num_proposals').addEventListener('click', e=>{
    graph.line('num_proposals', num_proposals);
  })
  document.getElementById('num_proposalOngoing').addEventListener('click', e=>{
    graph.line('num_proposalOngoing', num_proposalOngoing);
  })
  document.getElementById('num_proposalApproved').addEventListener('click', e=>{
    graph.line('num_proposalApproved', num_proposalApproved);
  })
  document.getElementById('num_facilitator_in_deliberation').addEventListener('click', e=>{
    graph.line('num_facilitator_in_deliberation', num_facilitator_in_deliberation);
  })
  document.getElementById('num_supremeJudge_in_deliberation').addEventListener('click', e=>{
    graph.line('num_supremeJudge_in_deliberation', num_supremeJudge_in_deliberation);
  })

})();