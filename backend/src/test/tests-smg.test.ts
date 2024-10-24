import { addCandidate } from '../application/services/candidateService';
import { Candidate } from '../domain/models/Candidate';
import { validateCandidateData } from '../application/validator';
import { Education } from '../domain/models/Education';
import { WorkExperience } from '../domain/models/WorkExperience';
import { Resume } from '../domain/models/Resume';

jest.mock('../domain/models/Candidate');
jest.mock('../application/validator');
jest.mock('../domain/models/Education');
jest.mock('../domain/models/WorkExperience');
jest.mock('../domain/models/Resume');

describe('addCandidate', () => {
    const candidateData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        educations: [{ degree: 'B.Sc', institution: 'University' }],
        workExperiences: [{ company: 'Company', role: 'Developer' }],
        cv: { fileName: 'resume.pdf', fileContent: '...' }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw an error if validation fails', async () => {
        (validateCandidateData as jest.Mock).mockImplementation(() => {
            throw new Error('Validation Error');
        });

        await expect(addCandidate(candidateData)).rejects.toThrow('Validation Error');
    });

    it('should save candidate and related data successfully', async () => {
        // Mock validateCandidateData to resolve successfully
        

        const result = await addCandidate(candidateData);

        expect(Candidate.prototype.save).toHaveBeenCalled();
        expect(Education.prototype.save).toHaveBeenCalled();
        expect(WorkExperience.prototype.save).toHaveBeenCalled();
        expect(Resume.prototype.save).toHaveBeenCalled();
    });

    it('should throw an error if unique constraint fails', async () => {
        (Candidate.prototype.save as jest.Mock).mockImplementation(() => {
            const error = new Error('Unique constraint failed');
            (error as any).code = 'P2002';
            throw error;
        });

        await expect(addCandidate(candidateData)).rejects.toThrow('The email already exists in the database');
    });

    it('should throw a general error', async () => {
        (Candidate.prototype.save as jest.Mock).mockImplementation(() => {
            throw new Error('General Error');
        });

        await expect(addCandidate(candidateData)).rejects.toThrow('General Error');
    });

    it('should handle empty education and work experience arrays', async () => {
        const candidateDataWithoutEducationAndExperience = {
            ...candidateData,
            educations: [],
            workExperiences: []
        };

        (validateCandidateData as jest.Mock).mockImplementation(() => true);

        const savedCandidate = { id: '123', ...candidateDataWithoutEducationAndExperience, education: [], workExperience: [], resumes: [] };
        (Candidate.prototype.save as jest.Mock).mockResolvedValue(savedCandidate);

        const savedResume = { id: '101', ...candidateData.cv };
        (Resume.prototype.save as jest.Mock).mockResolvedValue(savedResume);

        const result = await addCandidate(candidateDataWithoutEducationAndExperience);

        expect(result).toEqual(savedCandidate);
        expect(Candidate.prototype.save).toHaveBeenCalled();
        expect(Education.prototype.save).not.toHaveBeenCalled();
        expect(WorkExperience.prototype.save).not.toHaveBeenCalled();
        expect(Resume.prototype.save).toHaveBeenCalled();
    });

    it('should handle missing CV', async () => {
        const candidateDataWithoutCV = {
            ...candidateData,
            cv: null
        };

        (validateCandidateData as jest.Mock).mockImplementation(() => true);

        const savedCandidate = { id: '123', ...candidateDataWithoutCV, education: [], workExperience: [], resumes: [] };
        (Candidate.prototype.save as jest.Mock).mockResolvedValue(savedCandidate);

        const savedEducation = { id: '456', ...candidateData.educations[0] };
        (Education.prototype.save as jest.Mock).mockResolvedValue(savedEducation);

        const savedExperience = { id: '789', ...candidateData.workExperiences[0] };
        (WorkExperience.prototype.save as jest.Mock).mockResolvedValue(savedExperience);

        const result = await addCandidate(candidateDataWithoutCV);

        expect(result).toEqual(savedCandidate);
        expect(Candidate.prototype.save).toHaveBeenCalled();
        expect(Education.prototype.save).toHaveBeenCalled();
        expect(WorkExperience.prototype.save).toHaveBeenCalled();
        expect(Resume.prototype.save).not.toHaveBeenCalled();
    });
});