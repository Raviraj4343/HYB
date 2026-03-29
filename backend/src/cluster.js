import cluster from 'cluster';
import os from 'os';

const numCPUs = process.env.WEB_CONCURRENCY ? Number(process.env.WEB_CONCURRENCY) : os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Master process ${process.pid} is running - forking ${numCPUs} workers`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`Worker ${worker.process.pid} died. Spawning a new worker.`);
    cluster.fork();
  });
} else {
  // Workers run the main server
  import('./index.js').then(() => {
    console.log(`Worker ${process.pid} started`);
  }).catch((err) => {
    console.error('Failed to start worker', err);
    process.exit(1);
  });
}
