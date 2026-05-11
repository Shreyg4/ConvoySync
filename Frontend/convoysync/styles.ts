import { StyleSheet } from 'react-native';
import { THEME } from './theme';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLOR.black,
    justifyContent: 'flex-start',
    padding: THEME.SPACING.lg,
  },
  title: {
    color: THEME.COLOR.white,
    fontSize: THEME.FONT_SIZE.xxxl,
    fontWeight: THEME.FONT_WEIGHT.black,
  },
  input: {
    backgroundColor: THEME.COLOR.surface,
    color: THEME.COLOR.neutral400,
    padding: THEME.SPACING.md,
    borderRadius: THEME.BORDER_RADIUS.xl,
    marginTop: THEME.SPACING.lg,
  },
  Button1: {
    backgroundColor: THEME.COLOR.mint,
    paddingVertical: THEME.SPACING.md,
    borderRadius: THEME.BORDER_RADIUS.xl,
    marginTop: THEME.SPACING.lg,
    alignItems: 'center',
  },
  Button2: {
    borderStyle: 'dashed',
    borderColor: THEME.COLOR.neutral500,
    borderWidth: 1,
    paddingVertical: THEME.SPACING.md,
    paddingHorizontal: THEME.SPACING.lg,
    borderRadius: THEME.BORDER_RADIUS.xl,
    marginTop: THEME.SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ButtonText2: {
    color: THEME.COLOR.neutral500,
    fontSize: THEME.FONT_SIZE.lg,
    fontWeight: THEME.FONT_WEIGHT.medium,
  },
});
