import fs from 'node:fs';
let schema=fs.readFileSync('prisma/schema.prisma','utf8');
if(!schema.includes('model WorkoutSession')){
for(const name of ['UserSettings','WorkoutSession','SessionExercise','WorkoutSet','BodyWeightEntry'])schema+=`\nmodel ${name} {\n id String @id\n userId String\n payload String\n localDate String?\n parentId String?\n exerciseSlug String?\n revision Int\n lastOperationId String\n deletedAt String?\n @@index([userId, localDate])\n @@index([userId, exerciseSlug, localDate])\n @@index([parentId])\n ${name==='BodyWeightEntry'?'@@unique([userId, localDate])':name==='UserSettings'?'@@unique([userId])':''}\n}\n`;
schema+=`\nmodel SyncReceipt {\n id String @id\n userId String\n operationId String\n requestHash String\n entityId String\n resultRevision Int\n resultPayload String\n createdAt String\n @@unique([userId, operationId])\n @@index([userId, createdAt])\n}\nmodel Exercise {\n slug String @id\n payload String\n}\nmodel PlanTemplate {\n id String @id\n revision Int\n payload String\n}\nmodel PlanExercise {\n id String @id\n templateId String\n order Int\n payload String\n @@index([templateId, order])\n}\n`;
fs.writeFileSync('prisma/schema.prisma',schema);
}
