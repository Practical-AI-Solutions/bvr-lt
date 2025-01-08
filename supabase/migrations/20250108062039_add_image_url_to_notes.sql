-- Add image_url column to notes table
ALTER TABLE notes ADD COLUMN image_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN notes.image_url IS 'URL of the original image stored in Supabase Storage';
