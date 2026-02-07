import './connect.js';
import express from 'express';
import pokemon from './schema/pokemon.js';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());
// Permet d'accéder aux images des pokémons dans le dossier assets
app.use('/assets', express.static('assets'));

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// // GET tous les pokémons
// app.get('/pokemons', async (req, res) => {
//   try {
//     const pokemons = await pokemon.find({});
//     res.json(pokemons);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch pokemons' });
//   }
// });

// GET les pokémons avec pagination (dynamique)
app.get('/pokemons', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    
    // CORRECTION ICI : On accepte la limite envoyée par le client, sinon 20 par défaut
    const limit = parseInt(req.query.limit) || 20; 
    
    const skip = (page - 1) * limit;

    // Construction du filtre MongoDB
    let query = {};
    
    // Si on a une recherche textuelle
    if (search) {
      query = {
        $or: [
          { 'name.french': { $regex: search, $options: 'i' } },
          { 'type': { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // OPTIONNEL : Si tu veux gérer le filtre par type côté serveur plus tard
    if (req.query.type && req.query.type !== 'All') {
        query.type = req.query.type;
    }

    const totalPokemons = await pokemon.countDocuments(query);
    const pokemons = await pokemon.find(query)
      .skip(skip)
      .limit(limit);

    res.json({
      pokemons,
      total: totalPokemons,
      totalPages: Math.ceil(totalPokemons / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error); // Ajout d'un log pour voir l'erreur serveur si besoin
    res.status(500).json({ error: 'Failed to fetch pokemons' });
  }
});

// GET un pokémon par son id
app.get('/pokemons/:id', async (req, res) => {
  try {
    const pokemonData = await pokemon.findOne({ id: req.params.id });
    if (!pokemonData) {
      return res.status(404).json({ error: 'Pokemon not found' });
    }
    res.json(pokemonData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pokemon' });
  }
});

// GET un pokémon par son nom français
app.get('/pokemons/name/:name', async (req, res) => {
  try {
    const pokemonData = await pokemon.findOne({ 'name.french': req.params.name });
    if (!pokemonData) {
      return res.status(404).json({ error: 'Pokemon not found' });
    }
    res.json(pokemonData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pokemon' });
  }
});

// DELETE un pokémon par son id
app.delete('/pokemons/:id', async (req, res) => {
  try {
    const result = await pokemon.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Pokemon not found' });
    }
    res.json({ message: 'Pokemon deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete pokemon' });
  }
});

// POST un nouveau pokémon
app.post('/pokemons', async (req, res) => {
  try {
    const lastPokemon = await pokemon.findOne().sort({ id: -1 });
    const newId = lastPokemon ? lastPokemon.id + 1 : 1;

    const frenchName = req.body.name?.french || "Nouveau Pokémon";
    const sentBase = req.body.base || {};

    const newPokemonData = {
      id: newId,
      name: {
        french: frenchName,
        english: frenchName,
        japanese: frenchName,
        chinese: frenchName
      },
      type: req.body.type || ['Normal'],
      
      base: {
        HP: sentBase.HP || 50,
        Attack: sentBase.Attack || 50,
        Defense: sentBase.Defense || 50,
        SpecialAttack: sentBase["Special Attack"] || sentBase.SpecialAttack || 50,
        SpecialDefense: sentBase["Special Defense"] || sentBase.SpecialDefense || 50,
        Speed: sentBase.Speed || 50
      },

      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png"
    };

    // Si une image valide est envoyée, on la prend
    if (req.body.image && typeof req.body.image === 'string') {
        newPokemonData.image = req.body.image;
    }

    const newPokemon = new pokemon(newPokemonData);
    await newPokemon.save();
    
    console.log("✅ Pokémon créé :", frenchName);
    res.status(201).json(newPokemon);

  } catch (error) {
    console.error("❌ Erreur création :", error.message);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE un pokémon par son id
app.put('/pokemons/update/:id', express.json(), async (req, res) => {
  try {
    const updatedPokemon = await pokemon.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    if (!updatedPokemon) {
      return res.status(404).json({ error: 'Pokemon not found' });
    }
    res.json(updatedPokemon);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update pokemon' });
  }
});

console.log('Server is set up. Ready to start listening on a port.');

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});