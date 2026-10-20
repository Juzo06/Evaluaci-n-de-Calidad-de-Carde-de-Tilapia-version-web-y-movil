package co.unillanos.secct.usecases.services;

import co.unillanos.secct.entities.LogEntry;
import co.unillanos.secct.infrastructure.repositories.LogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** Records business events in the database and in the application log file. */
@Service
public class LogService {

    private static final Logger logger = LoggerFactory.getLogger(LogService.class);

    private final LogRepository logRepository;

    public LogService(LogRepository logRepository) {
        this.logRepository = logRepository;
    }

    public void recordEvent(String eventCode, Integer userId, Integer batchId, Integer evaluationId,
                            String description) {
        logRepository.save(new LogEntry(eventCode, userId, batchId, evaluationId, description));
        logger.info("event={} userId={} batchId={} evaluationId={} description={}",
                eventCode, userId, batchId, evaluationId, description);
    }
}
