import {
  doc,
  setDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  addDoc,
  deleteDoc,
  where,      
  getDocs,
  limit,
  writeBatch,
  getDoc,
  updateDoc,
  increment,    //  Import `getDocs` for a one-time fetch
} from 'firebase/firestore';
import { db } from './firebase.ts';
import { Deadline, Goal, GoalCompletionStatus, JournalEntry, SummitMessage, UserAttribute } from '../types';



export const createEntry = async (uid: string, entryText: string): Promise<string> => {
  const entriesCol = collection(db, `journals/${uid}/entries`);
  const newEntryData = {
    entryText,
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(entriesCol, newEntryData);
  return docRef.id;
};

export const updateEntryFeedback = async (uid:string, entryId: string, feedback: object) => {
  const entryRef = doc(db, `journals/${uid}/entries`, entryId);
  await setDoc(entryRef, { feedback }, { merge: true });
};

export const getEntriesStream = (
  uid: string,
  onEntriesUpdate: (entries: JournalEntry[]) => void
) => {
  const entriesCol = collection(db, `journals/${uid}/entries`);
  const q = query(entriesCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as JournalEntry));
    onEntriesUpdate(entries);
  });
};

export const deleteEntry = async (uid: string, entryId: string) => {
  if (!uid || !entryId) {
    throw new Error("User ID and Entry ID are required to delete an entry.");
  }
  const entryRef = doc(db, `journals/${uid}/entries`, entryId);
  await deleteDoc(entryRef);
};


// --- NEW FUNCTION TO FETCH GOALS ---
/**
 * Fetches all 'in_progress' weekly goals for a given user.
 * This is a one-time fetch, not a real-time listener.
 */
export const getActiveWeeklyGoals = async (uid: string): Promise<Goal[]> => {
  if (!uid) return [];

  try {
    // We assume goals are stored in a subcollection under the user's document
    // e.g., /users/{uid}/goals/{goalId}
    const goalsCol = collection(db, `users/${uid}/goals`);
    
    // Create a query to get only the goals that are weekly and in progress
    const q = query(
      goalsCol,
      where('type', '==', 'weekly'),
      where('status', '==', 'in_progress')
    );

    const querySnapshot = await getDocs(q);
    
    const goals = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Goal));

    return goals;
  } catch (error) {
    console.error("Error fetching active weekly goals:", error);
    return []; // Return an empty array on error to prevent crashes
  }
};

/**
 * Fetches all attributes for a given user.
 * This is used to provide long-term memory context to the AI.
 * @param uid The ID of the user.
 * @returns A promise that resolves to an array of attribute strings.
 */
export const getAllAttributes = async (uid: string): Promise<string[]> => {
  if (!uid) {
    console.warn("getAllAttributes called without a user ID.");
    return [];
  }

  try {
    const attributesRef = collection(db, `users/${uid}/attributes`);
    const q = query(attributesRef); // Simple query to get all documents
    const querySnapshot = await getDocs(q);

    const attributes: string[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Ensure the document has a 'text' field before pushing
      if (data.text && typeof data.text === 'string') {
        attributes.push(data.text);
      }
    });

    return attributes;

  } catch (error) {
    console.error("Error fetching user attributes from Firestore:", error);
    // In case of an error, return an empty array to prevent the AI call from failing.
    // The user will just get a less-personalized response.
    return [];
  }
};

export const saveAttribute = async (uid: string, newAttributeText: string, entryId: string) => {
  const attributesRef = collection(db, `users/${uid}/attributes`);
  
  // Check current count
  const snapshot = await getDocs(attributesRef);
  if (snapshot.size >= 50) {
    // If full, find the least recently used attribute
    const lruQuery = query(attributesRef, orderBy('lastAccessed', 'asc'), limit(1));
    const lruSnapshot = await getDocs(lruQuery);
    if (!lruSnapshot.empty) {
      const docToDelete = lruSnapshot.docs[0];
      await deleteDoc(doc(db, `users/${uid}/attributes`, docToDelete.id));
      console.log("Pruned least recently used attribute:", docToDelete.data().text);
    }
  }

  // Now, add the new attribute
  await addDoc(attributesRef, {
    text: newAttributeText,
    createdAt: Timestamp.now(),
    lastAccessed: Timestamp.now(), // It's new, so it's just been accessed
    sourceEntryIds: [entryId],
  });
};

/**
 * Gets a real-time stream of a user's attributes, ordered by creation date.
 * @param uid The ID of the user.
 * @param onUpdate A callback function that receives the updated list of attributes.
 * @returns An unsubscribe function to clean up the listener.
 */
export const getAttributesStream = (
  uid: string,
  onUpdate: (attributes: UserAttribute[]) => void
) => {
  const attributesRef = collection(db, `users/${uid}/attributes`);
  const q = query(attributesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const attributes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as UserAttribute));
    onUpdate(attributes);
  });
};

/**
 * Deletes a specific attribute document from Firestore.
 * @param uid The ID of the user.
 * @param attributeId The ID of the attribute document to delete.
 */
export const deleteAttribute = async (uid: string, attributeId: string) => {
  if (!uid || !attributeId) {
    throw new Error("User ID and Attribute ID are required for deletion.");
  }
  const attributeRef = doc(db, `users/${uid}/attributes`, attributeId);
  await deleteDoc(attributeRef);
};

// --- NEW FUNCTIONS for the Advisor Summit ---

/**
 * Fetches a single journal entry document.
 * @param uid The user's ID.
 * @param entryId The entry's document ID.
 * @returns A promise that resolves to the JournalEntry object or null if not found.
 */
export const getEntry = async (uid: string, entryId: string): Promise<JournalEntry | null> => {
  const entryRef = doc(db, `journals/${uid}/entries`, entryId);
  const docSnap = await getDoc(entryRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as JournalEntry;
  }
  return null;
};

/**
 * Gets a real-time stream of messages for a specific Advisor Summit.
 * @param uid The user's ID.
 * @param entryId The ID of the entry the summit belongs to.
 * @param onUpdate A callback that receives the updated list of messages.
 * @returns An unsubscribe function for cleanup.
 */
export const getSummitStream = (
  uid: string,
  entryId: string,
  onUpdate: (messages: SummitMessage[]) => void
) => {
  const summitRef = collection(db, `journals/${uid}/entries/${entryId}/summit`);
  const q = query(summitRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as SummitMessage));
    onUpdate(messages);
  });
};

/**
 * Adds one or more turns to an Advisor Summit transcript in Firestore.
 * @param uid The user's ID.
 * @param entryId The entry's ID.
 * @param turns A single message object or an array of message objects to add.
 */
export const addSummitTurns = async (
  uid: string,
  entryId: string,
  turn: { author: string; text: string }
) => {
  const summitRef = collection(db, `journals/${uid}/entries/${entryId}/summit`);
  // The turn object already contains the author and text. We just add the timestamp.
  await addDoc(summitRef, {
    ...turn,
    createdAt: Timestamp.now()
  });
};

/** Gets a real-time stream of all goals for a user. */
export const getGoalsStream = (uid: string, onUpdate: (goals: Goal[]) => void) => {
  const goalsCol = collection(db, `users/${uid}/goals`);
  const q = query(goalsCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
    onUpdate(goals);
  });
};

/** Creates a new goal document. */
export const createGoal = async (uid: string, data: Omit<Goal, 'id' | 'createdAt' | 'status' | 'completionStatus'>) => {
  const goalsCol = collection(db, `users/${uid}/goals`);
  await addDoc(goalsCol, {
    ...data,
    status: 'in_progress',
    completionStatus: {}, // Initialize as empty map
    createdAt: Timestamp.now(),
  });
};

export const updateGoal = async (uid: string, goalId: string, data: Partial<Omit<Goal, 'id' | 'createdAt' | 'status'>>) => {
  const goalRef = doc(db, `users/${uid}/goals`, goalId);
  // Ensure we don't accidentally wipe out the completionStatus map
  const updateData = { ...data };
  if (data.plannedDays === undefined) {
    updateData.plannedDays = []; // Or use deleteField() if you prefer
  }
  await updateDoc(goalRef, updateData);
};

/** Deletes a goal document. */
export const deleteGoal = async (uid: string, goalId: string) => {
  const goalRef = doc(db, `users/${uid}/goals`, goalId);
  await deleteDoc(goalRef);
};

/** Increments the progress of a specific goal. */
export const incrementGoalProgress = async (uid: string, goalId: string) => {
  const goalRef = doc(db, `users/${uid}/goals`, goalId);
  await updateDoc(goalRef, {
    progress: increment(1)
  });
};


/** Decrements the progress of a specific goal. */
export const decrementGoalProgress = async (uid: string, goalId: string) => {
  const goalRef = doc(db, `users/${uid}/goals`, goalId);
  // Firestore's increment can take a negative number
  await updateDoc(goalRef, { progress: increment(-1) });
};

/**
 * Helper function to get the date of the Monday of the current week.
 * @param d The date to check, defaults to now.
 */
const getStartOfWeek = (d = new Date()) => {
  const date = new Date(d);
  const day = date.getDay(); // Sunday - 0, Monday - 1, ...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(date.setDate(diff));
};


export const checkAndResetWeeklyGoals = async (uid:string) => {
  console.log("Checking if weekly goals need a reset...");
  const userRef = doc(db, `users/${uid}`);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();
  
  const lastResetTimestamp = userData?.lastWeeklyReset;
  const startOfThisWeek = getStartOfWeek();
  startOfThisWeek.setHours(0, 0, 0, 0);

  if (!lastResetTimestamp || lastResetTimestamp.toDate() < startOfThisWeek) {
    console.log("Reset required.");
    const goalsCol = collection(db, `users/${uid}/goals`);
    const q = query(goalsCol, where('type', '==', 'weekly'));
    const goalsToResetSnapshot = await getDocs(q);

    if (goalsToResetSnapshot.empty) {
        console.log("No weekly goals to reset.");
        await setDoc(userRef, { lastWeeklyReset: Timestamp.now() }, { merge: true });
        return;
    }

    const batch = writeBatch(db);
    goalsToResetSnapshot.forEach(goalDoc => {
      // --- MODIFIED: Reset completionStatus instead of progress ---
      batch.update(goalDoc.ref, { completionStatus: {} });
    });

    batch.set(userRef, { lastWeeklyReset: Timestamp.now() }, { merge: true });
    await batch.commit();
    console.log(`Weekly goals reset successfully for ${goalsToResetSnapshot.size} goals.`);
  } else {
    console.log("No weekly goal reset needed.");
  }
};

/**
 * Updates the completion status for a specific day on a goal.
 * @param uid The user's ID.
 * @param goalId The goal's ID.
 * @param dateString The date in 'YYYY-MM-DD' format.
 * @param newStatus The new status to set for that day.
 */
export const setGoalCompletionForDay = async (
  uid: string,
  goalId: string,
  dateString: string,
  newStatus: GoalCompletionStatus
) => {
  const goalRef = doc(db, `users/${uid}/goals`, goalId);
  // Use dot notation to update a specific key in a map field.
  await updateDoc(goalRef, {
    [`completionStatus.${dateString}`]: newStatus
  });
};

/** Gets a real-time stream of all pending deadlines, sorted by due date. */
export const getDeadlinesStream = (uid: string, onUpdate: (deadlines: Deadline[]) => void) => {
  const deadlinesCol = collection(db, `users/${uid}/deadlines`);
  // doesn't require a custom index.
  const q = query(deadlinesCol, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const deadlines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deadline));
    onUpdate(deadlines);
  }, (error) => {
      console.log("Deadlines listener error (likely collection doesn't exist yet):", error.message);
      onUpdate([]);
  });
};
/** Adds a new deadline document. */
export const addDeadline = async (uid: string, data: { title: string; dueDate: Date }) => {
  const deadlinesCol = collection(db, `users/${uid}/deadlines`);
  await addDoc(deadlinesCol, {
    ...data,
    dueDate: Timestamp.fromDate(data.dueDate),
    status: 'pending',
    createdAt: Timestamp.now(),
  });
};

/** Updates a deadline's status. */
export const updateDeadlineStatus = async (uid: string, deadlineId: string, status: 'pending' | 'completed') => {
  const deadlineRef = doc(db, `users/${uid}/deadlines`, deadlineId);
  await updateDoc(deadlineRef, { status });
};

/** Deletes a deadline document. */
export const deleteDeadline = async (uid: string, deadlineId: string) => {
  const deadlineRef = doc(db, `users/${uid}/deadlines`, deadlineId);
  await deleteDoc(deadlineRef);
};

/**
 * Fetches the most urgent pending deadlines for a user.
 * This is a one-time fetch, not a real-time listener.
 * @param uid The user's ID.
 * @returns A promise that resolves to an array of the 5 most urgent deadlines.
 */
/**
 * Fetches ALL deadlines for a user, then filters and sorts them locally.
 * @param uid The user's ID.
 * @returns A promise that resolves to an array of the 5 most urgent deadlines.
 */
export const getPendingDeadlines = async (uid: string): Promise<Deadline[]> => {
  if (!uid) return [];

  try {
    const deadlinesCol = collection(db, `users/${uid}/deadlines`);
    // 1. Fetch ALL documents. No complex query.
    const querySnapshot = await getDocs(deadlinesCol);
    
    const allDeadlines = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Deadline));

    // 2. Filter, sort, and slice in code, not in the database.
    const pendingAndSorted = allDeadlines
      .filter(d => d.status === 'pending')
      .sort((a, b) => a.dueDate.toMillis() - b.dueDate.toMillis());

    // 3. Return the 5 most urgent ones.
    return pendingAndSorted.slice(0, 5);

  } catch (error) {
    console.error("Error fetching all deadlines:", error);
    return []; // Return empty on error
  }
};