import { Graph } from './graph';
let graph = new Graph();

(()=>{
  graph.line('Population',
    {
    'day1': 1,
    'day30': 7,
    'day60': 30,
    'day90': 1000,
  });
})()