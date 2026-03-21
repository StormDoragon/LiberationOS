export interface BufferScheduleInput {
  text: string;
  channels: string[];
  scheduledAt: string;
}

export async function scheduleWithBuffer(input: BufferScheduleInput) {
  return {
    provider: "buffer",
    externalId: `bf_${Date.now()}`,
    scheduledAt: input.scheduledAt,
    channels: input.channels
  };
}
