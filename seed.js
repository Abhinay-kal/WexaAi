require('dotenv').config();
const neo4j = require('neo4j-driver');

const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USER || 'cognodb';
const PASSWORD = process.env.NEO4J_PASSWORD;

if (!URI || !PASSWORD) {
  console.error("Missing NEO4J_URI or NEO4J_PASSWORD in environment variables.");
  process.exit(1);
}

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

const seedDataCypher = `
// 1. Create Teams
CREATE (tAlpha:Team {name: "Team Alpha"}),
       (tBeta:Team {name: "Team Beta"}),
       (tGamma:Team {name: "Team Gamma"}),
       (tDelta:Team {name: "Team Delta"})

// 2. Create Databases
CREATE (dbUsers:Database {name: "UsersDB"}),
       (dbOrders:Database {name: "OrdersDB"}),
       (dbBilling:Database {name: "BillingDB"})

// 3. Create Services
CREATE (svcAuth:Service {name: "AuthService"}),
       (svcOrder:Service {name: "OrderService"}),
       (svcPayment:Service {name: "PaymentService"}),
       (svcNotification:Service {name: "NotificationService"}),
       (svcFrontend:Service {name: "FrontendAPI"})

// 4. Create Relationships: Teams Maintain Services and DBs
CREATE (tAlpha)-[:MAINTAINS]->(svcAuth),
       (tAlpha)-[:MAINTAINS]->(dbUsers),
       
       (tBeta)-[:MAINTAINS]->(svcOrder),
       (tBeta)-[:MAINTAINS]->(dbOrders),
       
       (tGamma)-[:MAINTAINS]->(svcPayment),
       (tGamma)-[:MAINTAINS]->(dbBilling),
       
       (tDelta)-[:MAINTAINS]->(svcNotification),
       (tDelta)-[:MAINTAINS]->(svcFrontend)

// 5. Create Relationships: Services Call Services
CREATE (svcFrontend)-[:CALLS]->(svcAuth),
       (svcFrontend)-[:CALLS]->(svcOrder),
       
       (svcOrder)-[:CALLS]->(svcAuth),
       (svcOrder)-[:CALLS]->(svcPayment),
       (svcOrder)-[:CALLS]->(svcNotification),
       
       (svcPayment)-[:CALLS]->(svcAuth)

// 6. Create Relationships: Services Read/Write Databases
CREATE (svcAuth)-[:READS_FROM]->(dbUsers),
       (svcAuth)-[:WRITES_TO]->(dbUsers),
       
       (svcOrder)-[:READS_FROM]->(dbOrders),
       (svcOrder)-[:WRITES_TO]->(dbOrders),
       
       (svcPayment)-[:READS_FROM]->(dbBilling),
       (svcPayment)-[:WRITES_TO]->(dbBilling)
`;

async function seed() {
  const session = driver.session();
  try {
    console.log("Clearing existing data...");
    await session.run('MATCH (n) DETACH DELETE n');
    
    console.log("Seeding graph data...");
    await session.run(seedDataCypher);
    
    console.log("Seed complete! Created teams, services, databases, and dependencies.");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();
