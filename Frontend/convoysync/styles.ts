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
  inputTitle: {
    color: THEME.COLOR.white,
    fontSize: THEME.FONT_SIZE.lg,
    fontWeight: THEME.FONT_WEIGHT.bold,
    marginTop: THEME.SPACING.xl,
    marginLeft: THEME.SPACING.sm,
    marginBottom: THEME.SPACING.sm,
  },
  input: {
    backgroundColor: THEME.COLOR.surface,
    color: THEME.COLOR.neutral400,
    padding: THEME.SPACING.md,
    borderRadius: THEME.BORDER_RADIUS.xl,
  },
  SubmitButton: {
    backgroundColor: THEME.COLOR.mint,
    paddingVertical: THEME.SPACING.md,
    borderRadius: THEME.BORDER_RADIUS.xl,
    marginTop: THEME.SPACING.lg,
    alignItems: 'center',
    boxShadow: '0 0 15px 5px #0c4131',
  },
  SubmitButtonText: {
    color: THEME.COLOR.black,
    fontSize: THEME.FONT_SIZE.lg,
    fontWeight: THEME.FONT_WEIGHT.black,
  },
  AddButton: {
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
  AddButtonText: {
    color: THEME.COLOR.neutral500,
    fontSize: THEME.FONT_SIZE.lg,
    fontWeight: THEME.FONT_WEIGHT.medium,
  },
  dateBar: {
    backgroundColor: THEME.COLOR.surface,
    borderRadius: THEME.BORDER_RADIUS.xl,
    justifyContent: 'center',
  },
  dateText: {
    color: THEME.COLOR.neutral400,
    fontSize: THEME.FONT_SIZE.lg,
    fontWeight: THEME.FONT_WEIGHT.medium,
  },
});
