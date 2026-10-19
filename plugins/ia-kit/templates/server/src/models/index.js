import { Sequelize } from 'sequelize';
import { env } from '../config/env.js';

// Connexion unique à la base, partagée par tous les modèles.
// La structure des tables se change UNIQUEMENT par des migrations, jamais avec sequelize.sync().
export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  define: { underscored: true },
});
