-- Function to create couple relationship after user signup
-- This function runs with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.create_couple_relationship_for_user(user_id UUID)
RETURNS UUID AS $$
DECLARE
  couple_id UUID;
BEGIN
  -- Check if user already has a couple relationship
  SELECT id INTO couple_id
  FROM couple_relationships
  WHERE partner_a_id = user_id OR partner_b_id = user_id;

  -- If no couple relationship exists, create one
  IF couple_id IS NULL THEN
    INSERT INTO couple_relationships (partner_a_id, status)
    VALUES (user_id, 'pending')
    RETURNING id INTO couple_id;
  END IF;

  RETURN couple_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_couple_relationship_for_user(UUID) TO authenticated;

-- Function to validate invitation token (can be called by anonymous users)
-- This function runs with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.validate_invitation_token(token TEXT)
RETURNS UUID AS $$
DECLARE
  couple_id UUID;
BEGIN
  -- Look up the couple_id by invitation token
  SELECT id INTO couple_id
  FROM couple_relationships
  WHERE invitation_token = token
    AND status = 'pending';

  -- Return the couple_id (will be NULL if token is invalid)
  RETURN couple_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.validate_invitation_token(TEXT) TO anon, authenticated;

-- Function to accept invitation and join as Partner B
-- This function runs with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.accept_couple_invitation(
  invitation_couple_id UUID,
  new_partner_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete any auto-created couple relationship for the new partner
  DELETE FROM couple_relationships
  WHERE partner_a_id = new_partner_id
    AND id != invitation_couple_id;

  -- Update the original couple relationship to link Partner B
  UPDATE couple_relationships
  SET partner_b_id = new_partner_id,
      status = 'active',
      invitation_token = NULL,
      updated_at = NOW()
  WHERE id = invitation_couple_id;

  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.accept_couple_invitation(UUID, UUID) TO authenticated;
