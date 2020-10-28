import { Graph } from './graph';
import population from './records/population';
import population_isBusy from './records/population_isBusy';
import num_facilitator from './records/num_facilitator';
import num_supremeJudge from './records/num_supremeJudge';
import num_proposals from './records/num_proposals';
import num_proposalOngoing from './records/num_proposalOngoing';
import num_proposalApproved from './records/num_proposalApproved';
import num_facilitator_isBusy from './records/num_facilitator_isBusy';
import num_supremeJudge_isBusy from './records/num_supremeJudge_isBusy';
import num_proposalOngoing_isBusy from './records/num_proposalOngoing_isBusy';

let graph = new Graph();

(()=>{
  graph.line('population', population);

  document.getElementById('population').addEventListener('click', e=>{
    graph.line('population', population);
  })
  document.getElementById('population_isBusy').addEventListener('click', e=>{
    graph.line('population_isBusy', population_isBusy);
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
  document.getElementById('num_facilitator_isBusy').addEventListener('click', e=>{
    graph.line('num_facilitator_isBusy', num_facilitator_isBusy);
  })
  document.getElementById('num_supremeJudge_isBusy').addEventListener('click', e=>{
    graph.line('num_supremeJudge_isBusy', num_supremeJudge_isBusy);
  })

})();