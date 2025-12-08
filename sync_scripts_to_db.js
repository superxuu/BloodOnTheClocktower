import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const scriptsPath = path.join(__dirname, 'src', 'data', 'scripts.json');
const scriptsData = JSON.parse(fs.readFileSync(scriptsPath, 'utf8'));

async function syncScripts() {
    console.log(`Found ${scriptsData.length} scripts in local file.`);

    for (const script of scriptsData) {
        console.log(`Processing script: ${script.title} (${script.id})...`);

        // Check if script already exists (by ID or Title)
        // Note: Our local IDs are strings like 'trouble_brewing', but DB IDs are UUIDs.
        // We'll check by title to avoid duplicates if we re-run.
        // Ideally, we should have used the same ID system, but for now let's check title.

        const { data: existingScripts, error: searchError } = await supabase
            .from('scripts')
            .select('id')
            .eq('title', script.title)
            .single();

        if (existingScripts) {
            console.log(`  - Script "${script.title}" already exists in DB. Skipping.`);
            continue;
        }

        // Insert Script
        const { data: insertedScript, error: insertError } = await supabase
            .from('scripts')
            .insert([{
                title: script.title,
                author: script.author,
                description: script.description,
                type: script.type || 'official'
            }])
            .select()
            .single();

        if (insertError) {
            console.error(`  - Error inserting script: ${insertError.message}`);
            continue;
        }

        console.log(`  - Inserted script with DB ID: ${insertedScript.id}`);

        // Insert Roles
        if (script.roles && script.roles.length > 0) {
            const rolesToInsert = script.roles.map(role => ({
                script_id: insertedScript.id,
                name: role.name,
                team: role.team,
                ability: role.ability,
                first_night: role.firstNight || false,
                other_night: role.otherNight || false
            }));

            const { error: rolesError } = await supabase
                .from('roles')
                .insert(rolesToInsert);

            if (rolesError) {
                console.error(`  - Error inserting roles: ${rolesError.message}`);
            } else {
                console.log(`  - Inserted ${rolesToInsert.length} roles.`);
            }
        }
    }

    console.log('Sync complete!');
}

syncScripts();
