// ========================
// PLAYER PSYCHOLOGY ENGINE
// ========================

import { Player } from '@/types/game';
import { PlayerExtended, PlayerChat, PlayerChatResponse, PlayerChatTopic, PlayerMilestone } from '@/types/playerExtended';

// ---- Confidence System ----
export function updateConfidenceAfterMatch(ext: PlayerExtended, matchRating: number, wasStarting: boolean): PlayerExtended {
  let delta = 0;
  if (matchRating >= 8) delta = 5 + Math.floor(Math.random() * 5);
  else if (matchRating >= 7) delta = 2;
  else if (matchRating >= 6) delta = 0;
  else if (matchRating >= 5) delta = -3;
  else delta = -6 - Math.floor(Math.random() * 4);

  // Dropped from squad = big confidence hit
  if (!wasStarting && ext.ego > 60) delta -= 5;

  const confidence = Math.max(0, Math.min(100, ext.confidence + delta));
  return { ...ext, confidence };
}

// ---- Form & Momentum ----
export function updateForm(ext: PlayerExtended, matchRating: number): PlayerExtended {
  const formHistory = [...ext.formHistory, matchRating].slice(-5);
  const rollingForm = formHistory.reduce((a, b) => a + b, 0) / formHistory.length;

  let momentum: PlayerExtended['momentum'] = 'neutral';
  if (rollingForm >= 8) momentum = 'hot';
  else if (rollingForm >= 7) momentum = 'warm';
  else if (rollingForm >= 5.5) momentum = 'neutral';
  else if (rollingForm >= 4) momentum = 'cold';
  else momentum = 'freezing';

  return { ...ext, formHistory, rollingForm: Math.round(rollingForm * 10) / 10, momentum };
}

// ---- Ego & Happiness ----
export function updateHappinessWeekly(ext: PlayerExtended, wasSelected: boolean, isStarter: boolean): PlayerExtended {
  let happinessDelta = 0;

  if (!wasSelected) {
    happinessDelta -= ext.ego > 70 ? 8 : ext.ego > 50 ? 4 : 2;
  } else if (!isStarter) {
    happinessDelta -= ext.ego > 70 ? 4 : 1;
  } else {
    happinessDelta += 2;
  }

  // Winning bonuses are applied separately
  const happiness = Math.max(0, Math.min(100, ext.happiness + happinessDelta));
  const wantsNewContract = ext.happiness < 40 || (ext.wantsNewContract && ext.happiness < 60);

  return { ...ext, happiness, wantsNewContract };
}

// ---- Mentoring ----
export interface MentoringPair {
  mentorId: string;
  menteeId: string;
  weeksActive: number;
  skillBoost: number; // extra development rate for mentee
  leadershipBoost: number; // bonus for mentor
}

export function calculateMentoringBoost(mentorExt: PlayerExtended, menteeExt: PlayerExtended): number {
  // Better mentors (high leadership, high caps) give better boosts
  const mentorQuality = (mentorExt.leadership * 0.4 + mentorExt.caps * 0.1 + mentorExt.composure * 0.2) / 100;
  // Mentees with higher development rate benefit more
  const baseBoost = mentorQuality * menteeExt.developmentRate * 0.3;
  return Math.round(baseBoost * 100) / 100;
}

export function weeklyDevelopment(ext: PlayerExtended, age: number, trainingIntensity: number = 1): PlayerExtended {
  if (age > 32) return ext; // Veterans don't develop further

  const potentialGap = ext.potential - (ext.confidence + ext.composure) / 2;
  if (potentialGap <= 0) return ext;

  // Young players with high potential develop faster
  const ageFactor = age < 23 ? 1.5 : age < 26 ? 1.2 : age < 29 ? 0.8 : 0.4;
  const developmentChance = ext.developmentRate * ageFactor * trainingIntensity * 0.1;

  // Random skill improvement
  if (Math.random() < developmentChance) {
    return {
      ...ext,
      composure: Math.min(100, ext.composure + 1),
      confidence: Math.min(100, ext.confidence + 1),
    };
  }

  return ext;
}

// ---- Milestones ----
export function checkMilestones(ext: PlayerExtended, player: Player, season: number, week: number, clubTryRecord?: number): PlayerExtended {
  const milestones = [...ext.milestones];
  const hasMilestone = (type: PlayerMilestone['type']) => milestones.some(m => m.type === type);

  if (ext.caps >= 50 && !hasMilestone('50_caps')) {
    milestones.push({
      type: '50_caps',
      achievedAt: { season, week },
      description: `${player.firstName} ${player.lastName} made their 50th appearance! Confidence boost.`
    });
  }
  if (ext.caps >= 100 && !hasMilestone('100_caps')) {
    milestones.push({
      type: '100_caps',
      achievedAt: { season, week },
      description: `${player.firstName} ${player.lastName} reached 100 caps! A true club legend — mentoring bonus unlocked.`
    });
  }
  if (ext.caps >= 150 && !hasMilestone('150_caps')) {
    milestones.push({
      type: '150_caps',
      achievedAt: { season, week },
      description: `${player.firstName} ${player.lastName} reached 150 caps! Testimonial match unlocked.`
    });
  }
  if (ext.internationalCaps >= 1 && !hasMilestone('international_debut')) {
    milestones.push({
      type: 'international_debut',
      achievedAt: { season, week },
      description: `${player.firstName} ${player.lastName} earned their first international cap!`
    });
  }
  
  // Try record milestone
  if (clubTryRecord && ext.totalTries > clubTryRecord && !hasMilestone('try_record')) {
    milestones.push({
      type: 'try_record',
      achievedAt: { season, week },
      description: `${player.firstName} ${player.lastName} broke the club try-scoring record with ${ext.totalTries} tries!`
    });
  }
  
  // Testimonial for 150+ cap veterans
  if (ext.caps >= 150 && player.age >= 33 && !hasMilestone('testimonial')) {
    milestones.push({
      type: 'testimonial',
      achievedAt: { season, week },
      description: `${player.firstName} ${player.lastName} has earned a testimonial match — a true servant of the club.`
    });
  }

  // Apply milestone confidence boosts
  const newMilestones = milestones.filter(m => !ext.milestones.some(em => em.type === m.type));
  let confidence = ext.confidence;
  let leadership = ext.leadership;
  
  for (const m of newMilestones) {
    if (m.type === '50_caps') confidence = Math.min(100, confidence + 10);
    if (m.type === '100_caps') { confidence = Math.min(100, confidence + 15); leadership = Math.min(100, leadership + 10); }
    if (m.type === '150_caps') leadership = Math.min(100, leadership + 5);
    if (m.type === 'try_record') confidence = Math.min(100, confidence + 12);
  }

  return { ...ext, milestones, confidence, leadership };
}

// ---- Chat Generation ----
export function generatePlayerChat(ext: PlayerExtended, player: Player): PlayerChat | null {
  // Only generate chats when something is wrong or noteworthy
  if (ext.happiness > 70 && ext.confidence > 50 && !ext.wantsNewContract) return null;

  let topic: PlayerChatTopic;
  let message: string;

  if (ext.wantsNewContract) {
    topic = 'contract';
    message = ext.frenchLeverage
      ? `Boss, my agent has had interest from a Top 14 club. I love it here but I need to know my future is secure. Can we talk about a new deal?`
      : `Gaffer, I think it's time we discussed a new contract. I've been performing well and I want to commit my future here.`;
  } else if (ext.happiness < 30) {
    topic = 'unhappy';
    message = `I'm not happy with how things are going. I feel like I'm not getting a fair crack and it's affecting me. Something needs to change.`;
  } else if (ext.happiness < 50 && ext.ego > 60) {
    topic = 'playing_time';
    message = `Coach, I need more game time. I'm better than what I'm showing sitting on the bench every week. I want to start.`;
  } else if (ext.confidence < 30) {
    topic = 'unhappy';
    message = `I'm struggling with my confidence at the moment. A few things haven't gone my way and I could use some support.`;
  } else {
    return null;
  }

  return {
    id: `chat_${player.id}_${Date.now()}`,
    playerId: player.id,
    topic,
    message,
    responses: generateChatResponses(topic, ext),
  };
}

function generateChatResponses(topic: PlayerChatTopic, ext: PlayerExtended): PlayerChatResponse[] {
  switch (topic) {
    case 'contract':
      return [
        {
          id: 'r1', text: "You're a big part of our plans. Let's get a deal done.",
          tone: 'supportive',
          effect: { happiness: 15, confidence: 5, ego: 5 }
        },
        {
          id: 'r2', text: "You'll need to earn a new deal on the pitch first. Keep performing.",
          tone: 'firm',
          effect: { happiness: -5, confidence: 5, ego: -5 }
        },
        {
          id: 'r3', text: "I hear you. Let me discuss it with the board and come back to you.",
          tone: 'neutral',
          effect: { happiness: 5, confidence: 0, ego: 0 }
        },
      ];
    case 'playing_time':
      return [
        {
          id: 'r1', text: "You're right, you deserve more chances. I'll look at the selection.",
          tone: 'supportive',
          effect: { happiness: 15, confidence: 10, ego: 5 }
        },
        {
          id: 'r2', text: "Selection is based on merit. Train harder and your chance will come.",
          tone: 'firm',
          effect: { happiness: -5, confidence: -5, ego: -10 }
        },
        {
          id: 'r3', text: "I value your contribution even when you're not starting. You're important to this squad.",
          tone: 'motivational',
          effect: { happiness: 8, confidence: 8, ego: -3 }
        },
      ];
    case 'unhappy':
      return [
        {
          id: 'r1', text: "I understand. Let's work together to get you back to your best.",
          tone: 'supportive',
          effect: { happiness: 10, confidence: 10, ego: 0 }
        },
        {
          id: 'r2', text: "Everyone goes through tough patches. You've got the quality — trust the process.",
          tone: 'motivational',
          effect: { happiness: 8, confidence: 12, ego: 0 }
        },
        {
          id: 'r3', text: "I need players who are mentally strong. Dig deep and prove your worth.",
          tone: 'firm',
          effect: { happiness: -3, confidence: 5, ego: -5 }
        },
      ];
    default:
      return [
        {
          id: 'r1', text: "Thanks for coming to me. Let's sort this out.",
          tone: 'neutral',
          effect: { happiness: 5, confidence: 5, ego: 0 }
        },
      ];
  }
}

// ---- Integration for new signings ----
export function weeklyIntegration(ext: PlayerExtended): PlayerExtended {
  if (!ext.isNewSigning || ext.integrationWeeks <= 0) return ext;

  const integrationWeeks = ext.integrationWeeks - 1;
  const isNewSigning = integrationWeeks > 0;

  // Cultural fit affects integration speed
  const fitBonus = ext.culturalFit > 80 ? 1 : 0;
  const adjustedWeeks = Math.max(0, integrationWeeks - fitBonus);

  return { ...ext, integrationWeeks: adjustedWeeks, isNewSigning: adjustedWeeks > 0 };
}

// ---- Rest & Fatigue Management ----
export function assessRestNeeds(ext: PlayerExtended, age: number): PlayerExtended {
  const matchThreshold = age > 30 ? 3 : age > 27 ? 4 : 5;

  if (ext.matchesSinceRest >= matchThreshold && ext.weeklyFatigue > 60) {
    return { ...ext, needsRest: true, restWeeksRequired: age > 30 ? 2 : 1 };
  }

  return ext;
}

// ---- Overall psychology score for display ----
export function getOverallMorale(ext: PlayerExtended): number {
  return Math.round(
    ext.happiness * 0.35 +
    ext.confidence * 0.35 +
    ext.composure * 0.15 +
    (100 - ext.ego * 0.3) * 0.15
  );
}

export function getMoraleLabel(morale: number): string {
  if (morale >= 85) return 'Excellent';
  if (morale >= 70) return 'Good';
  if (morale >= 55) return 'Fair';
  if (morale >= 40) return 'Low';
  return 'Critical';
}

export function getMoraleColor(morale: number): string {
  if (morale >= 85) return 'text-green-500';
  if (morale >= 70) return 'text-emerald-400';
  if (morale >= 55) return 'text-yellow-500';
  if (morale >= 40) return 'text-orange-500';
  return 'text-red-500';
}
