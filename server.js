require('dotenv').config();
const express = require('express');
const neo4j = require('neo4j-driver');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Setup Neo4j Driver
// Read from environment variables
const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USER || 'cognodb';
const PASSWORD = process.env.NEO4J_PASSWORD;

let driver;

try {
  driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
  driver.getServerInfo().then(info => {
    console.log('Connected to Neo4j database:', info.agent);
  }).catch(err => {
    console.error('Connection error\n', err);
  });
} catch (error) {
  console.error('Error initializing Neo4j driver:', error);
}

app.use(express.static('public'));
app.use(express.json());

// API Endpoint: Get impact of a failing microservice
app.get('/api/impact/:serviceName', async (req, res) => {
  const { serviceName } = req.params;
  const session = driver.session();
  
  try {
    // Cypher query: Find all services that depend (directly or indirectly) on the failing service
    // and the teams that maintain them.
    const cypher = `
      MATCH path = (dependent:Service)-[:CALLS|READS_FROM*]->(failing:Service {name: $serviceName})
      MATCH (team:Team)-[:MAINTAINS]->(dependent)
      RETURN dependent.name AS affectedService, team.name AS teamToNotify, length(path) AS hops
      ORDER BY hops ASC
    `;
    
    const result = await session.run(cypher, { serviceName });
    
    const impactList = result.records.map(record => ({
      affectedService: record.get('affectedService'),
      teamToNotify: record.get('teamToNotify'),
      hops: record.get('hops').toInt()
    }));
    
    res.json({ failingService: serviceName, impact: impactList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database query failed' });
  } finally {
    await session.close();
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  if (driver) await driver.close();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
