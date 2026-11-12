import { fetchMyClassroom } from '../../lib/schools/schoolService';

/**
 * Veli & Öğrenci Ekosistemi + Öğretmen Sınıf Masası (Classroom) Slice
 * useMemolandumStore içinden ayrılarak modüler yapıya kavuşturulmuştur.
 */
export function createParentClassroomSlice(set, get) {
  return {
    isParentAccount: false,
    parentEmailDigest: false,
    childrenProfiles: [],
    activeChildId: null,
    parentActivityLog: [],
    joinedClassroom: null,

    setIsParentAccount: (isParent) => {
      set({ isParentAccount: !!isParent });
      const uid = get().uid;
      if (uid) {
        import('../../lib/firebase/authService').then(({ syncParentDataToCloud }) => {
          syncParentDataToCloud(uid, { isParentAccount: !!isParent });
        }).catch(() => {});
      }
    },

    setParentEmailDigest: (status) => {
      set({ parentEmailDigest: !!status });
      const uid = get().uid;
      if (uid) {
        import('../../lib/firebase/authService').then(({ syncParentDataToCloud }) => {
          syncParentDataToCloud(uid, { parentEmailDigest: !!status });
        }).catch(() => {});
      }
    },

    addChildProfile: (childData) => {
      const state = get();
      const childId = childData.id || `child_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const seed = encodeURIComponent(childData.name || "Child");
      const newChild = {
        id: childId,
        name: childData.name || "Öğrenci",
        grade: childData.grade || "meb-2-sinif-kelimeleri",
        gradeLabel: childData.gradeLabel || "2. Sınıf İngilizce",
        avatar: childData.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${seed}`,
        dailyTarget: Number(childData.dailyTarget) || 15,
        createdAt: Date.now(),
        lastStudiedAt: Date.now(),
        lastStudiedTopic: "Henüz derse başlanmadı",
      };

      const nextChildren = [...(state.childrenProfiles || []), newChild];
      set({
        isParentAccount: true,
        childrenProfiles: nextChildren,
        activeChildId: childId,
        ...(newChild.grade ? { lastPlayedLevel: newChild.grade, lastPlayedLang: 'en-tr' } : {}),
      });

      const uid = state.uid;
      if (uid) {
        import('../../lib/firebase/authService').then(({ syncParentDataToCloud }) => {
          syncParentDataToCloud(uid, {
            isParentAccount: true,
            childrenProfiles: nextChildren,
            activeChildId: childId,
          });
        }).catch(() => {});
      }
      return childId;
    },

    updateChildProfile: (childId, updates) => {
      const state = get();
      const nextChildren = (state.childrenProfiles || []).map((c) =>
        c.id === childId ? { ...c, ...updates } : c
      );
      set({ childrenProfiles: nextChildren });

      const uid = state.uid;
      if (uid) {
        import('../../lib/firebase/authService').then(({ syncParentDataToCloud }) => {
          syncParentDataToCloud(uid, { childrenProfiles: nextChildren });
        }).catch(() => {});
      }
    },

    removeChildProfile: (childId) => {
      const state = get();
      const nextChildren = (state.childrenProfiles || []).filter((c) => c.id !== childId);
      const nextActiveId = state.activeChildId === childId
        ? (nextChildren[0]?.id || null)
        : state.activeChildId;

      set({
        childrenProfiles: nextChildren,
        activeChildId: nextActiveId,
        ...(nextChildren.length === 0 ? { isParentAccount: false } : {}),
      });

      const uid = state.uid;
      if (uid) {
        import('../../lib/firebase/authService').then(({ syncParentDataToCloud }) => {
          syncParentDataToCloud(uid, {
            childrenProfiles: nextChildren,
            activeChildId: nextActiveId,
            isParentAccount: nextChildren.length > 0,
          });
        }).catch(() => {});
      }
    },

    setActiveChild: (childId) => {
      const state = get();
      const child = (state.childrenProfiles || []).find((c) => c.id === childId);
      if (!child) return;

      set({
        activeChildId: childId,
        ...(child.grade ? { lastPlayedLevel: child.grade, lastPlayedLang: 'en-tr' } : {}),
      });

      const uid = state.uid;
      if (uid) {
        import('../../lib/firebase/authService').then(({ syncParentDataToCloud }) => {
          syncParentDataToCloud(uid, { activeChildId: childId });
        }).catch(() => {});
      }
    },

    logParentActivity: ({ type, summary, wordsCount = 1, score = 0, levelId = null } = {}) => {
      const state = get();
      const hasChildren = state.childrenProfiles && state.childrenProfiles.length > 0;
      if (!state.isParentAccount && !hasChildren) return;

      const activeChild = hasChildren
        ? (state.childrenProfiles.find((c) => c.id === state.activeChildId) || state.childrenProfiles[0])
        : null;
      const now = Date.now();
      const childName = activeChild?.name || state.profile?.displayName || "Öğrenci";
      const childId = activeChild?.id || "default_student";

      const prevLogs = state.parentActivityLog || [];
      const lastLog = prevLogs[0];

      // 5 dakika içinde aynı çocuğa ait aktivite varsa tek oturum olarak birleştir
      let nextLogs;
      if (lastLog && lastLog.childId === childId && (now - lastLog.timestamp) < 5 * 60 * 1000) {
        const combinedCount = (lastLog.wordsCount || 0) + (Number(wordsCount) || 1);
        const combinedScore = (lastLog.score || 0) + (Number(score) || 0);
        const updatedLog = {
          ...lastLog,
          timestamp: now,
          wordsCount: combinedCount,
          score: combinedScore,
          summary: summary || `${combinedCount} kelime çalışıldı`,
        };
        nextLogs = [updatedLog, ...prevLogs.slice(1)];
      } else {
        const newEntry = {
          id: `act_${now}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: now,
          childId,
          childName,
          type: type || "words_studied",
          summary: summary || `${wordsCount} kelime çalışıldı`,
          wordsCount: Number(wordsCount) || 1,
          score: Number(score) || 0,
          levelId: levelId || state.lastPlayedLevel || null,
        };
        nextLogs = [newEntry, ...prevLogs].slice(0, 50);
      }

      let nextChildren = state.childrenProfiles || [];
      if (activeChild) {
        nextChildren = nextChildren.map((c) =>
          c.id === activeChild.id
            ? {
                ...c,
                lastStudiedAt: now,
                lastStudiedTopic: summary || c.lastStudiedTopic,
              }
            : c
        );
      }

      set({
        parentActivityLog: nextLogs,
        childrenProfiles: nextChildren,
      });

      const uid = state.uid;
      if (uid) {
        import('../../lib/firebase/authService').then(({ logParentActivityToCloud, syncParentDataToCloud }) => {
          logParentActivityToCloud(uid, nextLogs[0], activeChild ? {
            lastStudiedAt: now,
            lastStudiedTopic: summary || activeChild.lastStudiedTopic,
          } : null);
          syncParentDataToCloud(uid, {
            parentActivityLog: nextLogs.slice(0, 50),
            ...(activeChild ? { childrenProfiles: nextChildren } : {}),
          });
        }).catch(() => {});
      }
    },

    setJoinedClassroom: (classroom) => {
      set({ joinedClassroom: classroom });
      const state = get();
      if (state.uid) {
        import("../../lib/firebase/authService")
          .then(({ syncStudentClassToCloud }) => {
            syncStudentClassToCloud(state.uid, classroom?.classCode || null);
          })
          .catch(() => {});
      }
    },

    /** Persist edilmiş üyelik özetini CF ile tazele (tam roster yok). */
    refreshJoinedClassroom: async () => {
      const state = get();
      const code = state.joinedClassroom?.classCode;
      if (!code || !state.uid) return null;
      try {
        const result = await fetchMyClassroom(code);
        const ownSeat = result?.ownSeat || result?.classroom?.students?.[result?.studentId] || null;
        const classroomPayload = {
          ...result.classroom,
          studentId: result.studentId,
          ownSeat,
          studentName: ownSeat?.name || state.joinedClassroom?.studentName || undefined,
          studentAvatar: ownSeat?.avatar || state.joinedClassroom?.studentAvatar || undefined,
          joinedAt: state.joinedClassroom?.joinedAt || Date.now(),
          childId: state.joinedClassroom?.childId || null,
        };
        set({ joinedClassroom: classroomPayload });
        return classroomPayload;
      } catch (err) {
        console.warn("refreshJoinedClassroom", err?.message || err);
        return null;
      }
    },

    /** Sınıfa katılmış öğrencinin ilerlemesini Firestore gradebook'a yazar (Debounce & Level-End Coalescing destekli) */
    syncJoinedClassroomProgress: (options = {}) => {
      const state = get();
      const jc = state.joinedClassroom;
      if (!jc?.classCode) return;

      // Roster seat = Firebase auth uid (firestore.rules ile hizalı)
      const studentId = state.uid || jc.studentId;
      if (!studentId) return;

      const childId = state.activeChildId || jc.childId || null;
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const history = (state.quizHistory || []).filter((h) => {
        const time = Number(h.timestamp) || 0;
        if (time < sevenDaysAgo) return false;
        if (!childId) return true;
        if (h.childId == null || h.childId === "") return true;
        return String(h.childId) === String(childId);
      });

      const correct = history.filter((h) => h.isCorrect);
      const uniqueWords = new Set(
        correct.map((h) => h.wordId || String(h.english || "").toLowerCase()).filter(Boolean)
      );
      const wordsLearned = uniqueWords.size;
      const accuracy =
        history.length > 0
          ? Math.round((correct.length / history.length) * 100)
          : null;

      const ownSeat = jc.students?.[studentId] || jc.ownSeat || null;
      const preservedName =
        ownSeat?.name ||
        jc.studentName ||
        (state.childrenProfiles || []).find((c) => c.id === childId)?.name ||
        undefined;
      const preservedAvatar = ownSeat?.avatar || jc.studentAvatar || undefined;

      import("../../lib/schools/schoolService").then(({ updateStudentClassProgress }) => {
        updateStudentClassProgress(
          jc.classCode,
          studentId,
          {
            wordsLearned,
            accuracy,
            ...(childId ? { childId } : {}),
            ...(preservedName ? { name: preservedName } : {}),
            ...(preservedAvatar ? { avatar: preservedAvatar } : {}),
          },
          { immediate: Boolean(options?.immediate) }
        );
      }).catch(() => {});
    },
  };
}
