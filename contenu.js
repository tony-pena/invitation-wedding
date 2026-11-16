/* =====================================================
   MODIFIEZ ICI VOS TEXTES — tout le reste s’adapte seul
   ===================================================== */
const CONTENU = {
  prenom1: "Prénom 1",
  prenom2: "Prénom 2",
  dateISO: "2027-06-12T14:00:00",          // date et heure exactes (pour le compte à rebours)
  dateTexte: "samedi 12 juin 2027",
  salle: "Nom de la salle",
  adresse: "Adresse de la salle",
  ville: "Ville",
  hashtag: "#PrenomEtPrenom",
  accueil: "Nous avons le bonheur de vous inviter à célébrer notre mariage.",

  histoire: [
    { date: "Notre rencontre", titre: "Un hasard heureux", texte: "Racontez ici, en deux ou trois phrases, comment vous vous êtes rencontrés." },
    { date: "Premier rendez-vous", titre: "Le début de tout", texte: "Le lieu, l’ambiance, le souvenir que vous gardez de ce premier moment." },
    { date: "La demande", titre: "Un oui plein de larmes", texte: "Où et comment la grande question a été posée, et la réponse." }
  ],

  photos: [                                   // gardez les mêmes noms (.jpg) ou changez-les ici
    "photos/galerie-1.jpg", "photos/galerie-2.jpg", "photos/galerie-3.jpg",
    "photos/galerie-4.jpg", "photos/galerie-5.jpg"
  ],
  photoAccueil: "photos/accueil.jpg",

  programme: [
    { h: "14h00", t: "Accueil des invités", d: "Un verre de bienvenue dans les jardins." },
    { h: "15h00", t: "Cérémonie", d: "Échange des vœux et des alliances." },
    { h: "16h30", t: "Séance photos", d: "Photos de famille et avec les mariés." },
    { h: "18h00", t: "Repas", d: "Dîner, musique et danse." },
    { h: "23h00", t: "Remerciements", d: "Un dernier mot avant de nous quitter." }
  ],

  tenue: "Élégante et chic. Nous aimerions voir ces teintes chaudes sur vous.",
  pastilles: [
    { nom: "Terracotta", c: "#B4563A" },
    { nom: "Sable", c: "#D9B99B" },
    { nom: "Brun profond", c: "#3A2318" }
  ],

  dateLimite: "1er mai 2027",                 // texte affiché
  limiteISO: "2027-05-01T23:59:59",           // après cette date, l’enregistrement se ferme
  cotes: ["Famille de {1}", "Famille de {2}", "Amis de {1}", "Amis de {2}", "Autre invité"],
  urlSite: "",                                // adresse publique du site, ex. https://invitation-mariage.vercel.app
  firebase: { apiKey: "AIzaSyD0Gtws8m4P0zQ2cAS3BoIM0nVZYOdgWkI", projectId: "invitatin-wedding" },    // base de données Firebase (voir les explications)
  envoi: ""                                   // (facultatif, sans Firebase) lien qui reçoit la liste des invités
};
