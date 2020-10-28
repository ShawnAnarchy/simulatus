import { Graph } from './graph';
import population from './records/population';
import population_isBusy from './records/population_isBusy';
import num_facilitator from './records/num_facilitator';
import num_supremeJudge from './records/num_supremeJudge';
import num_proposalOngoing from './records/num_proposalOngoing';

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
  document.getElementById('num_proposalOngoing').addEventListener('click', e=>{
    graph.line('num_proposalOngoing', num_proposalOngoing);
  })

})();