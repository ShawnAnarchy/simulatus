import { Graph } from './graph';
import poplutionRecord from './records/population.json';

let graph = new Graph();

(()=>{
  graph.line('population', poplutionRecord);
})()