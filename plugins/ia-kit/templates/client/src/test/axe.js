import axe from 'axe-core';
import { expect } from 'vitest';

// Vérifie l'accessibilité d'un rendu : libellés des champs, rôles, textes alternatifs, titres…
// Les contrastes de couleur ne sont pas testables ici (jsdom ne calcule pas les styles) :
// ils sont vérifiés dans le vrai navigateur.
export async function expectNoA11yViolations(container) {
  const { violations } = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(violations.map((v) => `${v.id} : ${v.help}`)).toEqual([]);
}
