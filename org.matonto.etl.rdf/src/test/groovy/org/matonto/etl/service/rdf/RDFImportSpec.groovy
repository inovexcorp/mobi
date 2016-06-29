package org.matonto.etl.service.rdf

import org.matonto.rdf.api.Model
import org.matonto.rdf.api.ModelFactory
import org.matonto.rdf.api.Statement
import org.matonto.rdf.core.impl.sesame.LinkedHashModel
import org.matonto.repository.api.DelegatingRepository
import org.matonto.repository.api.RepositoryConnection
import org.springframework.core.io.ClassPathResource
import spock.lang.Specification


class RDFImportSpec extends Specification {

    def "Throws exception if repository ID does not exist"(){
        setup:
        RDFImportServiceImpl importService = new RDFImportServiceImpl()
        File testFile = new ClassPathResource("importer/testFile.trig").getFile();

/*-
 * #%L
 * org.matonto.etl.rdf
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
        def mf = Mock(ModelFactory.class)
        importService.setModelFactory(mf)

        when:
        importService.importFile("test", testFile, true)

        then:
        1 * mf.createModel(_ as Collection<Statement>) >> new LinkedHashModel()
        thrown IllegalArgumentException
    }

    def "Test trig file"(){
        setup:
        def repo = Mock(DelegatingRepository.class)
        RepositoryConnection repoConn = Mock()
        ModelFactory factory = Mock()
        RDFImportServiceImpl importService = new RDFImportServiceImpl()
        File testFile = new ClassPathResource("importer/testFile.trig").getFile();

        when:
        importService.addRepository(repo)
        importService.setModelFactory(factory)
        importService.importFile("test", testFile, true)

        then:
        1 * repo.getRepositoryID() >> "test"
        1 * repo.getConnection() >> repoConn
        1 * factory.createModel(_) >> Mock(Model.class)
    }

    def "Invalid file type causes error"(){
        setup:
        RDFImportServiceImpl importService = new RDFImportServiceImpl()
        File f = new ClassPathResource("importer/testFile.txt").getFile();

        when:
        importService.importFile("test",f, true);

        then:
        thrown IOException
    }

    def "Nonexistent file throws exception"(){
        setup:
        RDFImportServiceImpl importService = new RDFImportServiceImpl()
        File f = new File("importer/FakeFile.txt");

        when:
        importService.importFile("test",f,true);

        then:
        thrown IOException
    }
}