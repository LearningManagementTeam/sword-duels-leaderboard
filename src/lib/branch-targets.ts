/** Official participating branch target for June area-wide. */
export const TARGET_BRANCH_COUNT = 135;

/** Minimum branches required to start June area-wide import. */
export const MIN_JUNE_PARTICIPANTS = 130;

export function branchCountLabel(count: number): string {
  if (count === 0) {
    return `Target ${TARGET_BRANCH_COUNT} branches`;
  }
  if (count < TARGET_BRANCH_COUNT) {
    return `${count} loaded · target ${TARGET_BRANCH_COUNT}`;
  }
  return `${count} branches in the arena`;
}

export function participantsLabel(count: number): string {
  if (count === 0) {
    return `All branches (target ${TARGET_BRANCH_COUNT})`;
  }
  return `All branches (${count})`;
}
